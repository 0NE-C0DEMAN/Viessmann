import Link from "next/link";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatPoints, formatEur } from "@/lib/money";
import { StatusPill } from "@/components/status-pill";
import { relativeDate } from "@/lib/utils";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { QuickActions } from "./quick-actions";
import { getT, type T } from "@/lib/i18n/server";

interface DashboardAggregate {
  balance: number;
  month_pts: number;
  total: number;
  approved: number;
  pending: number;
  oib: string;
  company_name: string;
}

export default async function InstallerHome() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  const { t } = await getT();

  // Single aggregate query — balance + month earnings + status counts + identity, in one round trip.
  const aggRows = (await db.execute(sql`
    SELECT
      COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = i.id), 0)::int AS balance,
      COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = i.id AND reason = 'accrual' AND created_at > NOW() - INTERVAL '30 days'), 0)::int AS month_pts,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id)::int AS total,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id AND status = 'approved')::int AS approved,
      (SELECT COUNT(*) FROM receipts WHERE installer_id = i.id AND status = 'needs_review')::int AS pending,
      i.oib, i.company_name
    FROM installers i
    WHERE i.id = ${s.installerId}
  `)) as unknown as DashboardAggregate[];
  const agg = aggRows[0];
  if (!agg) redirect("/login");

  const recent = await db
    .select()
    .from(receipts)
    .where(eq(receipts.installerId, s.installerId))
    .orderBy(desc(receipts.createdAt))
    .limit(5);

  const balance = agg.balance;
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
      <div>
        <div className="text-xs text-[var(--vie-ink-muted)]">{t("dash.welcome")}</div>
        <div className="font-bold text-lg leading-tight">{agg.company_name}</div>
      </div>

      {balance < 0 && (
        <div className="v-card border-[var(--vie-error)] bg-[var(--vie-error-bg)]/40">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-error)] mb-1">{t("dash.negBalance.title")}</div>
          <div className="text-sm">{t("dash.negBalance.body")}</div>
        </div>
      )}

      <div className={`rounded-2xl p-5 text-white ${tierClass[tier]} shadow-md relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.4), transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">{t(`tier.${tier}`)} {t("dash.tier")}</span>
            <span className="v-pill bg-white/20 text-white text-[10px] backdrop-blur">+{formatPoints(agg.month_pts)} {t("dash.thisMonth")}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-5xl font-bold tracking-tight v-numeric">{formatPoints(balance)}</div>
            <div className="text-sm opacity-80">{t("dash.points")}</div>
          </div>
          {nextTierAt ? (
            <>
              <div className="mt-4 h-1.5 rounded-full bg-white/25 overflow-hidden">
                <div className="h-full bg-white transition-all duration-500" style={{ width: `${tierProgress}%` }} />
              </div>
              <div className="text-xs mt-2 opacity-90">{formatPoints(Math.max(0, nextTierAt - balance))} {t("dash.toNextTier")}</div>
            </>
          ) : (
            <div className="text-xs mt-3 opacity-90 flex items-center gap-1"><Sparkles size={12} /> {t("dash.topTier")}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("dash.submissions")} value={agg.total} />
        <Stat label={t("dash.approved")} value={agg.approved} accent="success" />
        <Stat label={t("dash.pending")} value={agg.pending} accent="warn" />
      </div>

      <QuickActions />

      <div>
        <div className="flex items-center justify-between mb-2 mt-3">
          <div className="text-sm font-bold">{t("dash.recentSubs")}</div>
          <Link href="/app/history" prefetch className="text-xs text-[var(--vie-red)] font-semibold flex items-center gap-0.5">{t("dash.viewAll")} <ArrowRight size={12} /></Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Link key={r.id} href={`/app/receipts/${r.id}`} prefetch className="v-card v-card-tight v-card-interactive flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.wholesalerName ?? t("dash.unknownWholesaler")}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] truncate">
                    {r.invoiceNumber ?? "—"} · {formatEur(r.totalCents)} · {relativeDate(r.createdAt)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusPill status={r.status} />
                  {r.pointsAwarded > 0 && <div className="text-xs font-bold text-[var(--vie-red)]">+{formatPoints(r.pointsAwarded)}</div>}
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

function EmptyState({ t }: { t: T }) {
  return (
    <div className="v-card text-center py-8">
      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center">
        <TrendingUp size={20} />
      </div>
      <div className="font-semibold text-sm mt-3">{t("dash.empty.title")}</div>
      <div className="text-xs text-[var(--vie-ink-muted)] mt-1 mb-4">{t("dash.empty.body")}</div>
      <Link href="/app/submit" className="v-btn v-btn-primary v-btn-sm">{t("dash.empty.cta")}</Link>
    </div>
  );
}
