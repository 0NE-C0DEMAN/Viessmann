import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers, receipts } from "@/db/schema";
import { eq, sql, desc, count } from "drizzle-orm";
import { requireInstaller } from "@/lib/session";

export async function GET() {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const me = await db.select().from(installers).where(eq(installers.id, user.installerId)).limit(1);
  if (me.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const balanceRows = await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS balance FROM points_ledger WHERE installer_id = ${user.installerId}`,
  );
  type Row = { balance: number };
  const balance = (balanceRows as unknown as Row[])[0]?.balance ?? 0;

  const counts = await db
    .select({ status: receipts.status, n: count() })
    .from(receipts)
    .where(eq(receipts.installerId, user.installerId))
    .groupBy(receipts.status);

  const recent = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, user.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(5);

  // Tier ladder (placeholder): Bronze 0+, Silver 2k, Gold 8k, Platinum 25k
  const tier =
    balance >= 25000 ? "Platinum" :
    balance >= 8000 ? "Gold" :
    balance >= 2000 ? "Silver" :
    "Bronze";
  const nextTierAt =
    tier === "Bronze" ? 2000 :
    tier === "Silver" ? 8000 :
    tier === "Gold" ? 25000 :
    null;

  return NextResponse.json({
    me: {
      id: me[0].id,
      email: me[0].email,
      role: me[0].role,
      oib: me[0].oib,
      companyName: me[0].companyName,
      city: me[0].city,
    },
    balance,
    tier,
    nextTierAt,
    counts,
    recent,
  });
}
