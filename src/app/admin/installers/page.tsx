import { db } from "@/db";
import { installers, receipts } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { formatPoints } from "@/lib/money";

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
  const list = rows as unknown as Row[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Installers</h1>
      <div className="v-card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-xs text-[var(--vie-ink-soft)] border-b border-[var(--vie-line)]">
              <th className="py-2">Company</th>
              <th>OIB</th>
              <th>City</th>
              <th>Tier</th>
              <th>Submissions</th>
              <th>Approved</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0">
                <td className="py-2.5">
                  <div className="font-medium">{r.company_name}</div>
                  <div className="text-xs text-[var(--vie-ink-soft)]">{r.email}</div>
                </td>
                <td className="py-2.5 text-xs">{r.oib}</td>
                <td className="py-2.5 text-xs">{r.city ?? "—"}</td>
                <td className="py-2.5 text-xs">{r.tier}</td>
                <td className="py-2.5">{r.submissions}</td>
                <td className="py-2.5">{r.approved}</td>
                <td className="py-2.5 font-semibold">{formatPoints(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-soft)] py-8">No installers yet.</div>}
      </div>
    </div>
  );
}
