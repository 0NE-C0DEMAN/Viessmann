import { NextResponse } from "next/server";
import { db } from "@/db";
import { redemptions, rewards, pointsLedger, auditLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  status: z.enum(["requested", "shipped", "cancelled"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const cur = await db.select().from(redemptions).where(eq(redemptions.id, id)).limit(1);
  if (cur.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = cur[0];

  // No-op if status unchanged.
  if (r.status === parsed.data.status) {
    return NextResponse.json({ ok: true, status: r.status });
  }

  // Cancelling a redemption that hasn't shipped yet: refund the points and
  // restore one unit of inventory. (We don't reverse already-shipped items —
  // that's a separate "return" workflow out of scope here.)
  if (parsed.data.status === "cancelled" && r.status === "requested") {
    await db.insert(pointsLedger).values({
      installerId: r.installerId,
      delta: r.pointCost,
      reason: "reversal",
      redemptionId: r.id,
      actorId: admin.installerId,
      note: "Redemption cancelled by admin",
    });
    await db
      .update(rewards)
      .set({ inventory: sql`${rewards.inventory} + 1` })
      .where(eq(rewards.id, r.rewardId));
  }

  await db.update(redemptions).set({ status: parsed.data.status }).where(eq(redemptions.id, id));

  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: `redemption.${parsed.data.status}`,
    entityType: "redemption",
    entityId: id,
    payload: { previousStatus: r.status },
  });

  return NextResponse.json({ ok: true });
}
