import Link from "next/link";
import { db } from "@/db";
import { installers, receipts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatPoints } from "@/lib/money";
import { StatusPill } from "@/components/status-pill";
import { relativeDate } from "@/lib/utils";
import { Camera, FileText, ArrowRight } from "lucide-react";

export default async function InstallerHome() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const me = (await db.select().from(installers).where(eq(installers.id, s.installerId)).limit(1))[0];

  const balanceRows = (await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS balance FROM points_ledger WHERE installer_id = ${s.installerId}`,
  )) as unknown as Array<{ balance: number }>;
  const balance = balanceRows[0]?.balance ?? 0;

  const recent = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, s.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(4);

  const tier = balance >= 25000 ? "Platinum" : balance >= 8000 ? "Gold" : balance >= 2000 ? "Silver" : "Bronze";
  const nextTierAt = tier === "Bronze" ? 2000 : tier === "Silver" ? 8000 : tier === "Gold" ? 25000 : null;
  const tierProgress = nextTierAt ? Math.min(100, (balance / nextTierAt) * 100) : 100;

  const tierColours: Record<string, string> = {
    Bronze: "from-amber-700 to-amber-900",
    Silver: "from-slate-400 to-slate-600",
    Gold: "from-yellow-400 to-amber-500",
    Platinum: "from-zinc-300 via-zinc-400 to-zinc-600",
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-[var(--vie-ink-soft)]">Welcome back</div>
        <div className="text-lg font-bold tracking-tight">{me.companyName}</div>
        <div className="text-xs text-[var(--vie-ink-soft)]">OIB {me.oib}</div>
      </div>

      <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${tierColours[tier]} shadow-md`}>
        <div className="text-xs uppercase tracking-wider opacity-80">{tier} tier</div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="text-4xl font-bold tracking-tight">{formatPoints(balance)}</div>
          <div className="text-sm opacity-80">points</div>
        </div>
        {nextTierAt && (
          <>
            <div className="mt-3 h-1.5 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${tierProgress}%` }} />
            </div>
            <div className="text-xs mt-1.5 opacity-80">{formatPoints(Math.max(0, nextTierAt - balance))} pts to next tier</div>
          </>
        )}
        {!nextTierAt && <div className="text-xs mt-3 opacity-80">Top tier reached</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/submit?mode=camera" className="v-card flex flex-col gap-1 hover:border-[var(--vie-orange)] transition-colors">
          <Camera className="text-[var(--vie-orange)]" size={22} />
          <div className="font-semibold text-sm mt-1">Scan receipt</div>
          <div className="text-xs text-[var(--vie-ink-soft)]">Take a photo</div>
        </Link>
        <Link href="/app/submit?mode=upload" className="v-card flex flex-col gap-1 hover:border-[var(--vie-orange)] transition-colors">
          <FileText className="text-[var(--vie-orange)]" size={22} />
          <div className="font-semibold text-sm mt-1">Upload PDF / XML</div>
          <div className="text-xs text-[var(--vie-ink-soft)]">e-Invoice or PDF</div>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 mt-2">
          <div className="text-sm font-bold">Recent submissions</div>
          <Link href="/app/history" className="text-xs text-[var(--vie-orange)] font-semibold flex items-center gap-0.5">View all <ArrowRight size={12} /></Link>
        </div>
        {recent.length === 0 ? (
          <div className="v-card text-center text-sm text-[var(--vie-ink-soft)]">
            No submissions yet. Tap <span className="font-semibold text-[var(--vie-ink)]">Scan receipt</span> to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Link key={r.id} href={`/app/receipts/${r.id}`} className="v-card flex items-center justify-between hover:border-[var(--vie-orange)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.wholesalerName ?? "Unknown wholesaler"}</div>
                  <div className="text-xs text-[var(--vie-ink-soft)] truncate">
                    {r.invoiceNumber ?? "—"} · {relativeDate(r.createdAt)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <StatusPill status={r.status} />
                  <div className="text-xs font-bold">+{formatPoints(r.pointsAwarded)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
