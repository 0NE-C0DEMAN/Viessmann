import { db } from "@/db";
import { sql } from "drizzle-orm";
import { formatEur } from "@/lib/money";
import { WholesalersClient } from "./wholesalers-client";

export default async function AdminWholesalers() {
  // Aggregate metrics per wholesaler. We pull from the receipts table because
  // not every wholesaler we see is in the wholesalers seed.
  const rows = (await db.execute(sql`
    SELECT
      r.wholesaler_oib AS oib,
      r.wholesaler_name AS name,
      COUNT(*)::int AS submissions,
      COUNT(*) FILTER (WHERE r.status = 'approved')::int AS approved,
      COALESCE(SUM(r.total_cents) FILTER (WHERE r.status = 'approved'), 0)::bigint AS approved_value_cents,
      COALESCE(SUM(r.points_awarded) FILTER (WHERE r.status = 'approved'), 0)::int AS points_awarded,
      MAX(r.created_at) AS last_seen
    FROM receipts r
    WHERE r.wholesaler_oib IS NOT NULL
    GROUP BY r.wholesaler_oib, r.wholesaler_name
    ORDER BY approved_value_cents DESC
  `)) as unknown as Array<{
    oib: string;
    name: string | null;
    submissions: number;
    approved: number;
    approved_value_cents: number;
    points_awarded: number;
    last_seen: string;
  }>;

  // Format the bigint -> number safely for the client.
  const list = rows.map((r) => ({
    oib: r.oib,
    name: r.name ?? "Unknown wholesaler",
    submissions: r.submissions,
    approved: r.approved,
    approvedValue: formatEur(Number(r.approved_value_cents)),
    pointsAwarded: r.points_awarded,
    lastSeen: r.last_seen,
  }));

  return <WholesalersClient rows={list} />;
}
