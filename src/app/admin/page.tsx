import { db } from "@/db";
import { receipts, installers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { AdminQueueClient } from "./queue-client";

export default async function AdminQueue() {
  const rows = await db
    .select({
      r: receipts,
      installer: { id: installers.id, email: installers.email, companyName: installers.companyName, oib: installers.oib },
    })
    .from(receipts)
    .leftJoin(installers, eq(installers.id, receipts.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(500);

  const overall = (await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'needs_review')::int AS needs_review,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
      COUNT(*) FILTER (WHERE status = 'duplicate')::int AS duplicate,
      COUNT(*)::int AS total,
      COALESCE(SUM(points_awarded) FILTER (WHERE status = 'approved'), 0)::int AS total_points,
      COALESCE(SUM(total_cents) FILTER (WHERE status = 'approved'), 0)::bigint AS total_value
    FROM receipts
  `)) as unknown as Array<{ needs_review: number; approved: number; rejected: number; duplicate: number; total: number; total_points: number; total_value: number }>;
  const stats = overall[0] ?? { needs_review: 0, approved: 0, rejected: 0, duplicate: 0, total: 0, total_points: 0, total_value: 0 };

  return <AdminQueueClient rows={rows.map(({ r, installer }) => ({ ...r, installer }))} stats={stats} />;
}
