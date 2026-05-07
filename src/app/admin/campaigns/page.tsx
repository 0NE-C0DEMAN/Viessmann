import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CampaignsClient } from "./campaigns-client";

export default async function AdminCampaigns() {
  const list = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  return <CampaignsClient campaigns={list} />;
}
