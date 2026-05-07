import { db } from "@/db";
import { rewards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { RewardsList } from "./rewards-list";

export default async function RewardsPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const items = await db.select().from(rewards).where(eq(rewards.active, true));
  const balanceRows = (await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS balance FROM points_ledger WHERE installer_id = ${s.installerId}`,
  )) as unknown as Array<{ balance: number }>;
  const balance = balanceRows[0]?.balance ?? 0;

  return <RewardsList rewards={items} initialBalance={balance} />;
}
