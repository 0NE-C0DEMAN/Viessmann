import Link from "next/link";
import { db } from "@/db";
import { receipts, installers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { StatusPill } from "@/components/status-pill";
import { formatEur, formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";

export default async function AdminQueue() {
  const rows = await db
    .select({
      r: receipts,
      installer: { id: installers.id, email: installers.email, companyName: installers.companyName, oib: installers.oib },
    })
    .from(receipts)
    .leftJoin(installers, eq(installers.id, receipts.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(200);

  const counts = {
    needs_review: rows.filter((x) => x.r.status === "needs_review").length,
    approved: rows.filter((x) => x.r.status === "approved").length,
    rejected: rows.filter((x) => x.r.status === "rejected").length,
    duplicate: rows.filter((x) => x.r.status === "duplicate").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">All submissions across all installers.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Needs review" value={counts.needs_review} tone="warn" />
        <Stat label="Approved" value={counts.approved} tone="success" />
        <Stat label="Rejected" value={counts.rejected} tone="error" />
        <Stat label="Duplicates" value={counts.duplicate} tone="info" />
      </div>

      <div className="v-card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-xs text-[var(--vie-ink-soft)] border-b border-[var(--vie-line)]">
              <th className="py-2">Submitted</th>
              <th>Installer</th>
              <th>Wholesaler</th>
              <th>Invoice</th>
              <th>Total</th>
              <th>Points</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, installer }) => (
              <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0">
                <td className="py-2.5 text-xs text-[var(--vie-ink-soft)]">{relativeDate(r.createdAt)}</td>
                <td className="py-2.5">
                  <div className="font-medium">{installer?.companyName ?? "—"}</div>
                  <div className="text-xs text-[var(--vie-ink-soft)]">OIB {installer?.oib ?? "—"}</div>
                </td>
                <td className="py-2.5">{r.wholesalerName ?? "—"}</td>
                <td className="py-2.5">{r.invoiceNumber ?? "—"}</td>
                <td className="py-2.5">{formatEur(r.totalCents)}</td>
                <td className="py-2.5 font-semibold">{formatPoints(r.pointsAwarded)}</td>
                <td className="py-2.5"><StatusPill status={r.status} /></td>
                <td className="py-2.5 text-right">
                  <Link href={`/admin/receipts/${r.id}`} className="text-[var(--vie-orange)] font-semibold text-xs">Open →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-soft)] py-8">No submissions yet.</div>}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "warn" | "error" | "info" }) {
  const colours: Record<string, string> = {
    success: "text-[var(--vie-success)]",
    warn: "text-[var(--vie-warn)]",
    error: "text-[var(--vie-error)]",
    info: "text-[var(--vie-orange)]",
  };
  return (
    <div className="v-card">
      <div className="text-xs text-[var(--vie-ink-soft)]">{label}</div>
      <div className={`text-3xl font-bold ${colours[tone]}`}>{value}</div>
    </div>
  );
}
