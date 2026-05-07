import { db } from "@/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { toCsv } from "@/lib/csv";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = (await db.execute(sql`
    WITH balances AS (
      SELECT installer_id, COALESCE(SUM(delta), 0)::int AS balance
      FROM points_ledger GROUP BY installer_id
    )
    SELECT
      i.email, i.company_name, i.oib, i.city, i.postal_code, i.address, i.phone,
      i.disabled, i.vies_validated, i.created_at,
      COALESCE(b.balance, 0)::int AS balance,
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
  `)) as unknown as Array<{
    email: string;
    company_name: string;
    oib: string;
    city: string | null;
    postal_code: string | null;
    address: string | null;
    phone: string | null;
    disabled: boolean;
    vies_validated: boolean;
    created_at: string;
    balance: number;
    tier: string;
    submissions: number;
    approved: number;
  }>;

  const csv = toCsv(
    [
      "email", "company", "oib", "city", "postal_code", "address", "phone",
      "tier", "balance", "submissions", "approved", "disabled", "vies_validated", "joined",
    ],
    rows.map((r) => [
      r.email, r.company_name, r.oib, r.city ?? "", r.postal_code ?? "", r.address ?? "", r.phone ?? "",
      r.tier, r.balance, r.submissions, r.approved, r.disabled ? "yes" : "no",
      r.vies_validated ? "yes" : "no", new Date(r.created_at).toISOString().slice(0, 10),
    ]),
  );

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="installers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
