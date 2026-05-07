import { db } from "@/db";
import { rewards } from "@/db/schema";
import { desc } from "drizzle-orm";
import { RewardsAdminClient } from "./rewards-admin-client";

export default async function AdminRewards() {
  const list = await db.select().from(rewards).orderBy(desc(rewards.pointCost));
  return <RewardsAdminClient rewards={list} />;
}
