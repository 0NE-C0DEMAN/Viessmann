import { db } from "@/db";
import { sql } from "drizzle-orm";
import { InstallersClient } from "./installers-client";

export default async function AdminInstallers() {
  const rows = await db.execute(sql`
    WITH balances AS (
      SELECT installer_id, COALESCE(SUM(delta), 0)::int AS balance
      FROM points_ledger
      GROUP BY installer_id
    )
    SELECT
      i.id, i.email, i.company_name, i.oib, i.city, i.created_at,
      COALESCE(b.balance, 0) AS balance,
      CASE
        WHEN COALESCE(b.balance, 0) >= 25000 THEN 'Platinum'
        WHEN COALESCE(b.balance, 0) >= 8000 THEN 'Gold'
        WHEN COALESCE(b.balance, 0) >= 2000 THEN 'Silver'
        ELSE 'Bronze'
      END AS tier,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id)::int AS submissions,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id AND status = 'approved')::int AS approved
    FROM installers i
    LEFT JOIN balances b ON b.installer_id = i.id
    WHERE i.role = 'installer'
    ORDER BY balance DESC
  `);

  type Row = {
    id: string;
    email: string;
    company_name: string;
    oib: string;
    city: string | null;
    tier: string;
    balance: number;
    submissions: number;
    approved: number;
    created_at: string;
  };

  return <InstallersClient installers={(rows as unknown as Row[])} />;
}
