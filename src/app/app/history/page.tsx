import { db } from "@/db";
import { receipts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HistoryClient } from "./history-client";

export default async function HistoryPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, s.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(200);

  return <HistoryClient rows={rows} />;
}
