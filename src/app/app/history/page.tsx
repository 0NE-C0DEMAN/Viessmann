import Link from "next/link";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { formatPoints, formatEur } from "@/lib/money";
import { relativeDate } from "@/lib/utils";

export default async function HistoryPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, s.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Submissions</h1>
      {rows.length === 0 ? (
        <div className="v-card text-center text-sm text-[var(--vie-ink-soft)]">No submissions yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link key={r.id} href={`/app/receipts/${r.id}`} className="v-card block hover:border-[var(--vie-orange)] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.wholesalerName ?? "Unknown wholesaler"}</div>
                  <div className="text-xs text-[var(--vie-ink-soft)] truncate">
                    Invoice {r.invoiceNumber ?? "—"} · {relativeDate(r.createdAt)}
                  </div>
                  <div className="text-xs text-[var(--vie-ink-soft)] mt-1">{formatEur(r.totalCents)}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusPill status={r.status} />
                  <div className="text-sm font-bold">+{formatPoints(r.pointsAwarded)} pts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
