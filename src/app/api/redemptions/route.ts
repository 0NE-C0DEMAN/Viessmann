import { NextResponse } from "next/server";
import { db } from "@/db";
import { rewards, redemptions, pointsLedger, auditLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireInstaller } from "@/lib/session";
import { z } from "zod";

const Body = z.object({ rewardId: z.string().uuid() });

export async function POST(req: Request) {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Bad input" }, { status: 400 });

  const r = await db.select().from(rewards).where(eq(rewards.id, parsed.data.rewardId)).limit(1);
  if (r.length === 0 || !r[0].active) return NextResponse.json({ error: "Reward unavailable" }, { status: 404 });
  const reward = r[0];

  if (reward.inventory <= 0) return NextResponse.json({ error: "Out of stock" }, { status: 409 });

  // Compute current balance
  const balanceRows = await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS balance FROM points_ledger WHERE installer_id = ${user.installerId}`,
  );
  type Row = { balance: number };
  const balance = (balanceRows as unknown as Row[])[0]?.balance ?? 0;

  if (balance < reward.pointCost) {
    return NextResponse.json({ error: "Not enough points", balance, required: reward.pointCost }, { status: 402 });
  }

  // Decrement inventory atomically
  const upd = await db
    .update(rewards)
    .set({ inventory: sql`${rewards.inventory} - 1` })
    .where(sql`${rewards.id} = ${reward.id} AND ${rewards.inventory} > 0`)
    .returning({ id: rewards.id });
  if (upd.length === 0) return NextResponse.json({ error: "Out of stock" }, { status: 409 });

  const insertedRedemption = await db.insert(redemptions).values({
    installerId: user.installerId,
    rewardId: reward.id,
    pointCost: reward.pointCost,
    status: "requested",
  }).returning({ id: redemptions.id });

  await db.insert(pointsLedger).values({
    installerId: user.installerId,
    delta: -reward.pointCost,
    reason: "redemption",
    redemptionId: insertedRedemption[0].id,
    note: `Redeemed: ${reward.name}`,
  });

  await db.insert(auditLog).values({
    actorId: user.installerId,
    actorEmail: user.email,
    action: "redemption.requested",
    entityType: "redemption",
    entityId: insertedRedemption[0].id,
    payload: { rewardId: reward.id, pointCost: reward.pointCost },
  });

  return NextResponse.json({ ok: true, redemptionId: insertedRedemption[0].id, newBalance: balance - reward.pointCost });
}

export async function GET() {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      r: redemptions,
      reward: rewards,
    })
    .from(redemptions)
    .leftJoin(rewards, eq(rewards.id, redemptions.rewardId))
    .where(eq(redemptions.installerId, user.installerId))
    .orderBy(sql`${redemptions.createdAt} DESC`)
    .limit(50);

  return NextResponse.json({ redemptions: rows });
}
