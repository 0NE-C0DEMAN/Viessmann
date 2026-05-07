import { db } from "@/db";
import { sql } from "drizzle-orm";
import { InstallersClient } from "./installers-client";

export default async function AdminInstallers() {
  const rows = await db.execute(sql`
    SELECT
      i.id, i.email, i.company_name, i.oib, i.city, i.tier, i.created_at,
      COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = i.id), 0)::int AS balance,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id)::int AS submissions,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id AND status = 'approved')::int AS approved
    FROM installers i
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
