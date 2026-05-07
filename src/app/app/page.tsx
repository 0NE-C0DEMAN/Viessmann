import Link from "next/link";
import { db } from "@/db";
import { installers, receipts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatPoints, formatEur } from "@/lib/money";
import { StatusPill } from "@/components/status-pill";
import { relativeDate } from "@/lib/utils";
import { Camera, FileText, ArrowRight, TrendingUp, Sparkles } from "lucide-react";

export default async function InstallerHome() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const me = (await db.select().from(installers).where(eq(installers.id, s.installerId)).limit(1))[0];

  const balanceRows = (await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS balance FROM points_ledger WHERE installer_id = ${s.installerId}`,
  )) as unknown as Array<{ balance: number }>;
  const balance = balanceRows[0]?.balance ?? 0;

  // 30-day earned points
  const monthRows = (await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS pts FROM points_ledger WHERE installer_id = ${s.installerId} AND reason = 'accrual' AND created_at > NOW() - INTERVAL '30 days'`,
  )) as unknown as Array<{ pts: number }>;
  const monthPts = monthRows[0]?.pts ?? 0;

  // Counts
  const counts = (await db.execute(
    sql`SELECT
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'needs_review')::int AS pending,
      COUNT(*)::int AS total
    FROM receipts WHERE installer_id = ${s.installerId}`,
  )) as unknown as Array<{ approved: number; pending: number; total: number }>;
  const c = counts[0] ?? { approved: 0, pending: 0, total: 0 };

  const recent = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, s.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(5);

  const tier = balance >= 25000 ? "Platinum" : balance >= 8000 ? "Gold" : balance >= 2000 ? "Silver" : "Bronze";
  const nextTierAt = tier === "Bronze" ? 2000 : tier === "Silver" ? 8000 : tier === "Gold" ? 25000 : null;
  const tierBase = tier === "Bronze" ? 0 : tier === "Silver" ? 2000 : tier === "Gold" ? 8000 : 25000;
  const tierProgress = nextTierAt ? Math.min(100, ((balance - tierBase) / (nextTierAt - tierBase)) * 100) : 100;

  const tierClass: Record<string, string> = {
    Bronze: "v-tier-bronze",
    Silver: "v-tier-silver",
    Gold: "v-tier-gold",
    Platinum: "v-tier-platinum",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--vie-ink-muted)]">Welcome back</div>
          <div className="font-bold text-lg leading-tight">{me.companyName}</div>
        </div>
      </div>

      {/* Hero balance card */}
      <div className={`rounded-2xl p-5 text-white ${tierClass[tier]} shadow-md relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.4), transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">{tier} tier</span>
            <span className="v-pill bg-white/20 text-white text-[10px] backdrop-blur">+{formatPoints(monthPts)} this month</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-5xl font-bold tracking-tight v-numeric">{formatPoints(balance)}</div>
            <div className="text-sm opacity-80">points</div>
          </div>
          {nextTierAt ? (
            <>
              <div className="mt-4 h-1.5 rounded-full bg-white/25 overflow-hidden">
                <div className="h-full bg-white transition-all duration-500" style={{ width: `${tierProgress}%` }} />
              </div>
              <div className="text-xs mt-2 opacity-90">{formatPoints(Math.max(0, nextTierAt - balance))} pts to next tier</div>
            </>
          ) : (
            <div className="text-xs mt-3 opacity-90 flex items-center gap-1"><Sparkles size={12} /> Top tier reached</div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Submissions" value={c.total} />
        <Stat label="Approved" value={c.approved} accent="success" />
        <Stat label="Pending" value={c.pending} accent="warn" />
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-sm font-bold mb-2 mt-3">Quick actions</div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/app/submit?mode=camera" className="v-card v-card-interactive flex flex-col gap-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div className="font-semibold text-sm mt-1">Scan receipt</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">Take a photo</div>
          </Link>
          <Link href="/app/submit?mode=upload" className="v-card v-card-interactive flex flex-col gap-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div className="font-semibold text-sm mt-1">Upload PDF / XML</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">e-Invoice or PDF</div>
          </Link>
        </div>
      </div>

      {/* Recent submissions */}
      <div>
        <div className="flex items-center justify-between mb-2 mt-3">
          <div className="text-sm font-bold">Recent submissions</div>
          <Link href="/app/history" className="text-xs text-[var(--vie-orange)] font-semibold flex items-center gap-0.5">View all <ArrowRight size={12} /></Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Link key={r.id} href={`/app/receipts/${r.id}`} className="v-card v-card-tight v-card-interactive flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.wholesalerName ?? "Unknown wholesaler"}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] truncate">
                    {r.invoiceNumber ?? "—"} · {formatEur(r.totalCents)} · {relativeDate(r.createdAt)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusPill status={r.status} />
                  {r.pointsAwarded > 0 && <div className="text-xs font-bold text-[var(--vie-orange)]">+{formatPoints(r.pointsAwarded)}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "success" | "warn" }) {
  const colour = accent === "success" ? "text-[var(--vie-success)]" : accent === "warn" ? "text-[var(--vie-warn)]" : "text-[var(--vie-ink)]";
  return (
    <div className="v-card v-card-tight">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 v-numeric ${colour}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="v-card text-center py-8">
      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--vie-orange-light)] text-[var(--vie-orange-dark)] flex items-center justify-center">
        <TrendingUp size={20} />
      </div>
      <div className="font-semibold text-sm mt-3">No submissions yet</div>
      <div className="text-xs text-[var(--vie-ink-muted)] mt-1 mb-4">Your first submission earns instant points.</div>
      <Link href="/app/submit" className="v-btn v-btn-primary v-btn-sm">Submit your first invoice</Link>
    </div>
  );
}
