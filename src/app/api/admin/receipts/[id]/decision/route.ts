import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, receiptLineItems, pointsLedger, auditLog } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
  pointsOverride: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Bad input" }, { status: 400 });
  const { decision, note, pointsOverride } = parsed.data;

  const cur = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  if (cur.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = cur[0];

  // If currently approved, reverse the existing accrual before re-deciding.
  if (r.status === "approved") {
    const existing = await db
      .select({ id: pointsLedger.id, delta: pointsLedger.delta })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.receiptId, id), eq(pointsLedger.reason, "accrual")));
    for (const row of existing) {
      await db.insert(pointsLedger).values({
        installerId: r.installerId,
        delta: -row.delta,
        reason: "reversal",
        receiptId: id,
        reversedBy: row.id,
        actorId: admin.installerId,
        note: `Admin decision change to ${decision}`,
      });
    }
  }

  let newPoints = 0;
  if (decision === "approved") {
    if (pointsOverride != null) {
      newPoints = pointsOverride;
    } else {
      const lines = await db.select().from(receiptLineItems).where(eq(receiptLineItems.receiptId, id));
      newPoints = lines.reduce((s, l) => s + (l.pointsAwarded ?? 0), 0);
    }
    if (newPoints > 0) {
      await db.insert(pointsLedger).values({
        installerId: r.installerId,
        delta: newPoints,
        reason: "accrual",
        receiptId: id,
        actorId: admin.installerId,
        note: note ?? "Admin approved",
      });
    }
  }

  await db.update(receipts).set({
    status: decision,
    pointsAwarded: newPoints,
    reviewerNote: note ?? null,
    reviewedBy: admin.installerId,
    reviewedAt: sql`NOW()`,
  }).where(eq(receipts.id, id));

  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: `admin.receipt.${decision}`,
    entityType: "receipt",
    entityId: id,
    payload: { note, pointsOverride: pointsOverride ?? null, awarded: newPoints },
  });

  return NextResponse.json({ ok: true, status: decision, pointsAwarded: newPoints });
}
