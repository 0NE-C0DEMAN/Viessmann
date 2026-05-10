import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { receipts, receiptLineItems, products, installers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { StatusPill } from "@/components/status-pill";
import { formatEur, formatPoints } from "@/lib/money";
import { ArrowLeft } from "lucide-react";
import { AdminDecisionPanel } from "./decision-panel";
import { getT } from "@/lib/i18n/server";

export default async function AdminReceiptDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role !== "admin") redirect("/app");
  const { t, locale } = await getT();
  const dateLocale = locale === "hr" ? "hr-HR" : "en-GB";

  const rRows = await db
    .select({
      r: receipts,
      installer: { id: installers.id, email: installers.email, companyName: installers.companyName, oib: installers.oib, city: installers.city },
    })
    .from(receipts)
    .leftJoin(installers, eq(installers.id, receipts.installerId))
    .where(eq(receipts.id, id))
    .limit(1);
  if (rRows.length === 0) notFound();
  const { r, installer } = rRows[0];

  const lines = await db
    .select({ line: receiptLineItems, product: products })
    .from(receiptLineItems)
    .leftJoin(products, eq(products.id, receiptLineItems.matchedProductId))
    .where(eq(receiptLineItems.receiptId, id));

  const computedPoints = lines.reduce((s, l) => s + (l.line.pointsAwarded ?? 0), 0);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1"><ArrowLeft size={14} /> {t("admin.receipt.back")}</Link>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="v-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-[var(--vie-ink-soft)]">{t("admin.receipt.invoice")}</div>
                <div className="font-bold text-lg">{r.invoiceNumber ?? "—"}</div>
                <div className="text-xs text-[var(--vie-ink-soft)]">{r.issueDate ? new Date(r.issueDate).toLocaleDateString(dateLocale) : "—"}</div>
              </div>
              <StatusPill status={r.status} />
            </div>
            <hr className="my-3 border-[var(--vie-line)]" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[var(--vie-ink-soft)]">{t("admin.receipt.seller")}</div>
                <div className="font-semibold">{r.wholesalerName ?? "—"}</div>
                <div className="text-[var(--vie-ink-soft)]">OIB {r.wholesalerOib ?? "—"}</div>
              </div>
              <div>
                <div className="text-[var(--vie-ink-soft)]">{t("admin.receipt.buyer")}</div>
                <div className="font-semibold">{r.buyerName ?? "—"}</div>
                <div className="text-[var(--vie-ink-soft)]">OIB {r.buyerOib ?? "—"}</div>
              </div>
            </div>
            <hr className="my-3 border-[var(--vie-line)]" />
            <div className="text-xs">
              <div className="text-[var(--vie-ink-soft)]">{t("admin.receipt.submitter")}</div>
              <div className="font-semibold">{installer?.companyName ?? "—"}</div>
              <div className="text-[var(--vie-ink-soft)]">{installer?.email} · OIB {installer?.oib}</div>
            </div>
          </div>

          <div className="v-card">
            <div className="text-sm font-bold mb-3">{t("admin.receipt.lines")} ({lines.length})</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[var(--vie-ink-soft)] border-b border-[var(--vie-line)] text-left">
                  <th className="py-1.5">{t("admin.receipt.col.item")}</th>
                  <th>{t("admin.receipt.col.qty")}</th>
                  <th>{t("admin.receipt.col.price")}</th>
                  <th>{t("admin.receipt.col.amount")}</th>
                  <th>{t("admin.receipt.col.match")}</th>
                  <th className="text-right">{t("admin.receipt.col.pts")}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(({ line, product }) => (
                  <tr key={line.id} className="border-b border-[var(--vie-line)] last:border-b-0 align-top">
                    <td className="py-2 text-xs">
                      <div className="font-medium">{line.rawDescription}</div>
                      {line.kpdSifra && <div className="text-[var(--vie-ink-soft)]">KPD {line.kpdSifra}</div>}
                    </td>
                    <td className="py-2 text-xs">{line.quantity} {line.unit ?? ""}</td>
                    <td className="py-2 text-xs">{formatEur(line.unitPriceCents)}</td>
                    <td className="py-2 text-xs">{formatEur(line.amountCents)}</td>
                    <td className="py-2 text-xs">
                      {line.isViessmann ? (
                        product ? (
                          <div>
                            <div className="font-semibold">{product.model}</div>
                            <div className="text-[var(--vie-ink-soft)]">{line.matchKind} · {line.matchConfidence}%</div>
                          </div>
                        ) : (
                          <span className="text-[var(--vie-warn)]">{t("admin.receipt.unmatched")}</span>
                        )
                      ) : (
                        <span className="text-[var(--vie-ink-soft)]">{t("admin.receipt.other")}</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-xs font-semibold">
                      {line.pointsAwarded > 0 ? `+${formatPoints(line.pointsAwarded)}` : "—"}
                      {line.campaignName && line.pointsAwarded > line.pointsBase && (
                        <div className="text-[10px] text-[var(--vie-success)] font-semibold">
                          +{formatPoints(line.pointsAwarded - line.pointsBase)} · {line.campaignName}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="my-3 border-[var(--vie-line)]" />
            <div className="flex justify-between text-sm">
              <span className="text-[var(--vie-ink-soft)]">{t("receipt.subtotal")} {formatEur(r.subtotalCents)} · {t("receipt.vat")} {formatEur(r.vatCents)}</span>
              <span className="font-bold">{formatEur(r.totalCents)}</span>
            </div>
          </div>

          {r.fraudFlags && (r.fraudFlags as string[]).length > 0 && (
            <div className="v-card">
              <div className="text-xs font-bold mb-2 text-[var(--vie-warn)]">{t("admin.receipt.flagsTitle")}</div>
              <ul className="text-xs space-y-1 list-disc pl-4 text-[var(--vie-ink-soft)]">
                {(r.fraudFlags as string[]).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {r.fileUrl && (
            <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="v-btn v-btn-ghost w-full">{t("admin.receipt.viewFile")}</a>
          )}
        </div>

        <div>
          <AdminDecisionPanel
            receiptId={r.id}
            currentStatus={r.status}
            currentPoints={r.pointsAwarded}
            computedPoints={computedPoints}
          />
        </div>
      </div>
    </div>
  );
}
