// End-to-end receipt processing pipeline.
//   1. Fetch parsed JSON (from Claude vision OCR or XML parser).
//   2. Validate buyer OIB matches the submitting installer.
//   3. Match each line item against the Viessmann SKU catalog.
//   4. Compute points per line.
//   5. Run anti-fraud checks (duplicate, total mismatch).
//   6. Decide status: approved | needs_review | rejected.
//   7. Persist receipt + line items, append points to ledger if approved.

import { db } from "@/db";
import {
  receipts,
  receiptLineItems,
  products,
  pointsLedger,
  auditLog,
  wholesalers,
  installers,
  campaigns,
} from "@/db/schema";
import { and, eq, lte, or, isNull, gt, sql } from "drizzle-orm";
import { matchLine } from "@/lib/sku-matcher";
import { parseCroatianAmountToCents, parseQuantity } from "@/lib/money";
import { isValidOib, normaliseOib } from "@/lib/oib";
import { tierForBalance } from "@/lib/tier";
import type { ParsedReceipt } from "@/lib/receipt-parser";
import type { Campaign } from "@/db/schema";

// Per-installer rate limit. We allow this many submissions per ROLLING_HOURS.
const RATE_LIMIT_COUNT = 30;
const RATE_LIMIT_HOURS = 1;

export interface PipelineResult {
  receiptId: string;
  status: "approved" | "needs_review" | "rejected" | "duplicate";
  pointsAwarded: number;
  fraudFlags: string[];
  message: string;
  existingReceiptId?: string;
}

export interface PipelineInput {
  installerId: string;
  source: "ocr" | "xml";
  fileUrl: string | null;
  fileName: string | null;
  parsed: ParsedReceipt;
  rawText: string | null;
}

export async function runReceiptPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { installerId, source, fileUrl, fileName, parsed, rawText } = input;

  const installer = await db.select().from(installers).where(eq(installers.id, installerId)).limit(1);
  if (installer.length === 0) throw new Error("installer not found");
  const me = installer[0];

  const fraudFlags: string[] = [];

  // Velocity check — flag for review if the installer has made too many
  // submissions in the recent rolling window.
  const velocityRows = await db.execute<{ n: number }>(
    sql`SELECT COUNT(*)::int AS n FROM receipts
        WHERE installer_id = ${installerId}
          AND created_at > NOW() - (${RATE_LIMIT_HOURS}::int || ' hours')::interval`,
  );
  type VR = { n: number };
  const recentN = (velocityRows as unknown as VR[])[0]?.n ?? 0;
  if (recentN >= RATE_LIMIT_COUNT) {
    fraudFlags.push(`velocity_exceeded:${recentN}_in_${RATE_LIMIT_HOURS}h`);
  }

  // Currency sanity — only EUR is supported in the Croatian B2B context after
  // 01.01.2023. Anything else is flagged for review.
  const currency = (parsed.currency || "EUR").toUpperCase();
  if (currency !== "EUR") {
    fraudFlags.push(`currency_not_eur:${currency}`);
  }

  // OIB validation
  const wholesalerOib = normaliseOib(parsed.wholesaler?.oib ?? "");
  const buyerOib = normaliseOib(parsed.buyer?.oib ?? "");

  if (wholesalerOib && !isValidOib(wholesalerOib)) fraudFlags.push("seller_oib_invalid_checksum");
  if (buyerOib && !isValidOib(buyerOib)) fraudFlags.push("buyer_oib_invalid_checksum");
  if (!wholesalerOib) fraudFlags.push("seller_oib_missing");
  if (!buyerOib) fraudFlags.push("buyer_oib_missing");

  // Buyer must match installer
  let buyerMismatch = false;
  if (buyerOib && me.oib && buyerOib !== me.oib) {
    fraudFlags.push("buyer_oib_mismatch");
    buyerMismatch = true;
  }

  // Auto-register or fetch wholesaler row by OIB (so the demo can ingest unknown wholesalers smoothly).
  if (wholesalerOib && isValidOib(wholesalerOib)) {
    await db.insert(wholesalers).values({
      oib: wholesalerOib,
      name: parsed.wholesaler?.name ?? "Unknown wholesaler",
      address: parsed.wholesaler?.address ?? null,
      iban: parsed.wholesaler?.iban ?? null,
      trusted: true,
    }).onConflictDoNothing();
  }

  // Match line items + load active campaigns once.
  const [allProducts, activeCampaigns, campaignSpend] = await Promise.all([
    db.select().from(products),
    db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.active, true),
          lte(campaigns.startsAt, new Date()),
          or(isNull(campaigns.endsAt), gt(campaigns.endsAt, new Date())),
        ),
      ),
    // How much campaign bonus has this installer already claimed per campaign?
    db.execute<{ campaign_id: string; total: number }>(sql`
      SELECT rli.campaign_id, COALESCE(SUM(rli.points_awarded - rli.points_base), 0)::int AS total
      FROM receipt_line_items rli
      JOIN receipts r ON r.id = rli.receipt_id
      WHERE r.installer_id = ${installerId}
        AND r.status = 'approved'
        AND rli.campaign_id IS NOT NULL
      GROUP BY rli.campaign_id
    `),
  ]);

  type SpendRow = { campaign_id: string; total: number };
  const spendByCampaign = new Map<string, number>(
    (campaignSpend as unknown as SpendRow[]).map((r) => [r.campaign_id, r.total]),
  );

  const totalCents = parseCroatianAmountToCents(parsed.total) ?? null;
  const subtotalCents = parseCroatianAmountToCents(parsed.subtotal) ?? null;
  const vatCents = parseCroatianAmountToCents(parsed.vat_total) ?? null;

  const lineRecords: Array<{
    raw: string;
    kpd: string | null;
    unit: string | null;
    quantity: string;
    vat: string | null;
    unitCents: number;
    amountCents: number;
    matchedProductId: string | null;
    confidence: number;
    matchKind: string;
    isViessmann: boolean;
    pointsBase: number;
    pointsAwarded: number;
    campaignId: string | null;
    campaignName: string | null;
  }> = [];

  let totalPoints = 0;

  for (const li of parsed.line_items ?? []) {
    const unitCents = parseCroatianAmountToCents(li.unit_price) ?? 0;
    const amountCents = parseCroatianAmountToCents(li.amount) ?? 0;
    const qty = parseQuantity(li.quantity);
    const qtyNum = Number(qty) || 0;

    const match = matchLine(li.raw_description, li.kpd_sifra, allProducts);
    const basePoints = match.product ? Math.round(match.product.pointsPerUnit * qtyNum) : 0;

    // Pick the best applicable campaign for this line.
    // Match rule: campaign.productFamily IS NULL (matches all) OR equals match.product.family.
    // Stack rule: highest final-points wins; non-stackable.
    // Cap rule: if `capPerInstaller > 0`, the bonus this installer can earn
    // from this campaign is clamped to whatever's left of the cap.
    const family = match.product?.family ?? null;
    const candidate = pickBestCampaign(activeCampaigns, family, basePoints, qtyNum, spendByCampaign);
    const finalPoints = candidate ? candidate.finalPoints : basePoints;

    if (match.isViessmann && match.product == null) {
      fraudFlags.push(`line_unmatched_viessmann:${li.raw_description.slice(0, 60)}`);
    }
    totalPoints += finalPoints;

    lineRecords.push({
      raw: li.raw_description,
      kpd: li.kpd_sifra,
      unit: li.unit,
      quantity: qty,
      vat: li.vat_rate,
      unitCents,
      amountCents,
      matchedProductId: match.product?.id ?? null,
      confidence: match.confidence,
      matchKind: match.kind,
      isViessmann: match.isViessmann,
      pointsBase: basePoints,
      pointsAwarded: finalPoints,
      campaignId: candidate?.campaign.id ?? null,
      campaignName: candidate?.campaign.name ?? null,
    });
  }

  // Total integrity check
  if (totalCents != null && subtotalCents != null && vatCents != null) {
    const sum = subtotalCents + vatCents;
    if (Math.abs(sum - totalCents) > 5) fraudFlags.push("total_arithmetic_mismatch");
  }

  // Issue date sanity (within last 90 days, not in future)
  const issueDate = parsed.issue_date ? new Date(parsed.issue_date) : null;
  if (issueDate) {
    const now = Date.now();
    if (issueDate.getTime() > now + 24 * 3600 * 1000) fraudFlags.push("issue_date_in_future");
    const ninetyDays = 90 * 24 * 3600 * 1000;
    if (now - issueDate.getTime() > ninetyDays) fraudFlags.push("issue_date_older_than_90d");
  } else {
    fraudFlags.push("issue_date_missing");
  }

  // Decide status
  let status: PipelineResult["status"] = "approved";
  if (buyerMismatch) status = "rejected";
  else if (
    fraudFlags.includes("seller_oib_invalid_checksum") ||
    fraudFlags.includes("seller_oib_missing") ||
    fraudFlags.includes("buyer_oib_missing") ||
    fraudFlags.includes("issue_date_missing") ||
    fraudFlags.some((f) => f.startsWith("line_unmatched_viessmann"))
  ) {
    status = "needs_review";
  }
  // No Viessmann lines at all → reject (nothing to award)
  const hasViessmann = lineRecords.some((l) => l.isViessmann);
  if (!hasViessmann) status = "rejected";

  // Pre-flight duplicate check: if a row already exists for this
  // (seller OIB, invoice nr, buyer OIB, total), persist the new submission
  // as a "duplicate" row anyway so admins / installers can see all attempts.
  let existingReceiptId: string | null = null;
  if (wholesalerOib && parsed.invoice_number && buyerOib && totalCents != null) {
    const existing = await db
      .select({ id: receipts.id })
      .from(receipts)
      .where(
        and(
          eq(receipts.wholesalerOib, wholesalerOib),
          eq(receipts.invoiceNumber, parsed.invoice_number),
          eq(receipts.buyerOib, buyerOib),
          eq(receipts.totalCents, totalCents),
          eq(receipts.status, "approved"), // only consider already-credited receipts as the "original"
        ),
      )
      .orderBy(receipts.createdAt)
      .limit(1);
    if (existing.length > 0) {
      existingReceiptId = existing[0].id;
      status = "duplicate";
      fraudFlags.push("duplicate_of_existing_receipt");
    }
  }

  const inserted = await db
    .insert(receipts)
    .values({
      installerId,
      source,
      status,
      fileUrl,
      fileName,
      rawText,
      parsedJson: parsed as unknown as Record<string, unknown>,
      wholesalerOib: wholesalerOib || null,
      wholesalerName: parsed.wholesaler?.name ?? null,
      buyerOib: buyerOib || null,
      buyerName: parsed.buyer?.name ?? null,
      invoiceNumber: parsed.invoice_number ?? null,
      issueDate: issueDate ?? null,
      dueDate: parsed.due_date ? new Date(parsed.due_date) : null,
      currency: parsed.currency ?? "EUR",
      subtotalCents: subtotalCents ?? null,
      vatCents: vatCents ?? null,
      totalCents: totalCents ?? null,
      pointsAwarded: status === "approved" ? totalPoints : 0,
      reviewerNote: existingReceiptId ? `Duplicate of receipt ${existingReceiptId}` : null,
      fraudFlags,
    })
    .returning({ id: receipts.id });

  const receiptId = inserted[0].id;

  // Insert line items
  if (lineRecords.length > 0) {
    await db.insert(receiptLineItems).values(
      lineRecords.map((l, i) => ({
        receiptId,
        lineNumber: i + 1,
        rawDescription: l.raw,
        kpdSifra: l.kpd,
        unit: l.unit,
        quantity: l.quantity,
        vatRate: l.vat,
        unitPriceCents: l.unitCents,
        amountCents: l.amountCents,
        matchedProductId: l.matchedProductId,
        matchConfidence: l.confidence,
        matchKind: l.matchKind,
        isViessmann: l.isViessmann,
        pointsBase: l.pointsBase,
        pointsAwarded: l.pointsAwarded,
        campaignId: l.campaignId,
        campaignName: l.campaignName,
      })),
    );
  }

  // Append to ledger if approved, then check if the new balance crossed a tier threshold.
  if (status === "approved" && totalPoints > 0) {
    // Read the pre-accrual balance so we know whether this transaction
    // crosses a tier line.
    const beforeRows = await db.execute<{ b: number }>(
      sql`SELECT COALESCE(SUM(delta), 0)::int AS b FROM points_ledger WHERE installer_id = ${installerId}`,
    );
    type B = { b: number };
    const balanceBefore = (beforeRows as unknown as B[])[0]?.b ?? 0;

    await db.insert(pointsLedger).values({
      installerId,
      delta: totalPoints,
      reason: "accrual",
      receiptId,
      note: `Receipt ${parsed.invoice_number ?? receiptId}`,
    });

    const balanceAfter = balanceBefore + totalPoints;
    const tierBefore = tierForBalance(balanceBefore);
    const tierAfter = tierForBalance(balanceAfter);
    if (tierAfter !== tierBefore) {
      await db.insert(auditLog).values({
        actorId: installerId,
        actorEmail: me.email,
        action: "tier.changed",
        entityType: "installer",
        entityId: installerId,
        payload: { from: tierBefore, to: tierAfter, balanceAfter },
      });
    }
  }

  await db.insert(auditLog).values({
    actorId: installerId,
    actorEmail: me.email,
    action: `receipt.${status}`,
    entityType: "receipt",
    entityId: receiptId,
    payload: { fraudFlags, totalPoints },
  });

  return {
    receiptId,
    status,
    pointsAwarded: status === "approved" ? totalPoints : 0,
    fraudFlags,
    message: messageFor(status, fraudFlags),
    existingReceiptId: existingReceiptId ?? undefined,
  };
}

interface CampaignPick {
  campaign: Campaign;
  finalPoints: number;
}

function pickBestCampaign(
  campaignsList: Campaign[],
  family: string | null,
  basePoints: number,
  qty: number,
  spendByCampaign: Map<string, number>,
): CampaignPick | null {
  let best: CampaignPick | null = null;
  for (const c of campaignsList) {
    if (c.productFamily && family !== c.productFamily) continue;
    const multiplied = Math.round(basePoints * (c.bonusMultiplier / 100));
    const flat = Math.round(c.bonusFlatPerUnit * qty);
    let finalPoints = multiplied + flat;
    if (finalPoints <= basePoints) continue;

    // Apply per-installer cap (0 = unlimited).
    if (c.capPerInstaller > 0) {
      const alreadyClaimed = spendByCampaign.get(c.id) ?? 0;
      const remainingBonus = Math.max(0, c.capPerInstaller - alreadyClaimed);
      const proposedBonus = finalPoints - basePoints;
      if (proposedBonus > remainingBonus) {
        finalPoints = basePoints + remainingBonus;
      }
      if (finalPoints <= basePoints) continue;
    }

    if (!best || finalPoints > best.finalPoints) {
      best = { campaign: c, finalPoints };
    }
  }
  return best;
}

export class DuplicateReceiptError extends Error {
  constructor(public existingId?: string) {
    super("Duplicate receipt");
    this.name = "DuplicateReceiptError";
  }
}

function messageFor(status: PipelineResult["status"], flags: string[]): string {
  if (status === "approved") return "Approved. Points have been added to your balance.";
  if (status === "rejected") {
    if (flags.includes("buyer_oib_mismatch"))
      return "Rejected: the buyer OIB on this invoice does not match your account.";
    return "Rejected: no Viessmann products found on this invoice.";
  }
  if (status === "duplicate") return "This invoice has already been submitted previously.";
  return "Submitted for manual review by Viessmann.";
}


