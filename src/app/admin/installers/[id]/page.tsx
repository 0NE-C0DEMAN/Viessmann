import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { installers, receipts, redemptions, rewards, pointsLedger, auditLog } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { tierForBalance } from "@/lib/tier";
import { formatEur, formatPoints } from "@/lib/money";
import { StatusPill } from "@/components/status-pill";
import { relativeDate } from "@/lib/utils";
import { ArrowLeft, Mail, MapPin, Phone, Hash, Calendar, ScrollText } from "lucide-react";

export default async function AdminInstallerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role !== "admin") redirect("/app");

  const meRows = await db.select().from(installers).where(eq(installers.id, id)).limit(1);
  if (meRows.length === 0) notFound();
  const me = meRows[0];

  const [agg, theirReceipts, theirRedemptions, theirLedger, theirAudit] = await Promise.all([
    db.execute<{ balance: number; lifetime: number; submissions: number; approved: number }>(sql`
      SELECT
        COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = ${id}), 0)::int AS balance,
        COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = ${id} AND reason = 'accrual'), 0)::int AS lifetime,
        (SELECT COUNT(*) FROM receipts WHERE installer_id = ${id})::int AS submissions,
        (SELECT COUNT(*) FROM receipts WHERE installer_id = ${id} AND status = 'approved')::int AS approved
    `),
    db.select().from(receipts).where(eq(receipts.installerId, id)).orderBy(desc(receipts.createdAt)).limit(50),
    db
      .select({ r: redemptions, reward: rewards })
      .from(redemptions)
      .leftJoin(rewards, eq(rewards.id, redemptions.rewardId))
      .where(eq(redemptions.installerId, id))
      .orderBy(desc(redemptions.createdAt))
      .limit(20),
    db.select().from(pointsLedger).where(eq(pointsLedger.installerId, id)).orderBy(desc(pointsLedger.createdAt)).limit(40),
    db.select().from(auditLog).where(and(eq(auditLog.entityId, id))).orderBy(desc(auditLog.createdAt)).limit(20),
  ]);

  type AggRow = { balance: number; lifetime: number; submissions: number; approved: number };
  const stats = (agg as unknown as AggRow[])[0] ?? { balance: 0, lifetime: 0, submissions: 0, approved: 0 };
  const tier = tierForBalance(stats.balance);

  return (
    <div className="space-y-5">
      <Link href="/admin/installers" className="text-sm text-[var(--vie-ink-soft)] flex items-center gap-1"><ArrowLeft size={14} /> Back to installers</Link>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-1 space-y-4">
          <div className="v-card text-center">
            <div className="v-logo v-logo-lg mx-auto">{(me.companyName?.[0] ?? "?").toUpperCase()}</div>
            <div className="font-bold text-lg mt-3">{me.companyName}</div>
            <div className="text-xs text-[var(--vie-ink-muted)] flex items-center justify-center gap-1 mt-0.5"><Hash size={11} /> OIB {me.oib}</div>
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <span className="v-pill v-pill-brand">{tier} tier</span>
              <span className="v-pill v-pill-muted">Member since {new Date(me.createdAt).toLocaleDateString("hr-HR", { month: "short", year: "numeric" })}</span>
            </div>
          </div>

          <div className="v-card">
            <div className="text-sm font-bold mb-3">Account</div>
            <div className="space-y-2 text-sm">
              <Row icon={<Mail size={14} />} label="Email">{me.email}</Row>
              <Row icon={<MapPin size={14} />} label="Address">{me.address ?? "—"}{me.city ? `, ${me.postalCode ?? ""} ${me.city}` : ""}</Row>
              <Row icon={<Phone size={14} />} label="Phone">{me.phone ?? "—"}</Row>
              <Row icon={<Calendar size={14} />} label="Joined">{new Date(me.createdAt).toLocaleDateString("hr-HR")}</Row>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Balance" value={formatPoints(stats.balance)} tone="brand" />
            <Stat label="Lifetime earned" value={formatPoints(stats.lifetime)} tone="success" />
            <Stat label="Submissions" value={stats.submissions} />
            <Stat label="Approved" value={stats.approved} tone="success" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <div className="v-card">
            <div className="text-sm font-bold mb-3">Submissions</div>
            {theirReceipts.length === 0 ? (
              <div className="text-xs text-[var(--vie-ink-muted)]">No submissions yet.</div>
            ) : (
              <div className="v-scroll-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
                      <th className="py-2 font-semibold">When</th>
                      <th className="font-semibold">Wholesaler</th>
                      <th className="font-semibold">Invoice</th>
                      <th className="font-semibold">Total</th>
                      <th className="font-semibold">Pts</th>
                      <th className="font-semibold">Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {theirReceipts.map((r) => (
                      <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0">
                        <td className="py-2 text-xs text-[var(--vie-ink-muted)] whitespace-nowrap">{relativeDate(r.createdAt)}</td>
                        <td className="py-2 text-xs">{r.wholesalerName ?? "—"}</td>
                        <td className="py-2 text-xs v-numeric">{r.invoiceNumber ?? "—"}</td>
                        <td className="py-2 text-xs v-numeric">{formatEur(r.totalCents)}</td>
                        <td className="py-2 text-xs font-semibold v-numeric">{formatPoints(r.pointsAwarded)}</td>
                        <td className="py-2"><StatusPill status={r.status} /></td>
                        <td className="py-2 text-right">
                          <Link href={`/admin/receipts/${r.id}`} className="text-[var(--vie-orange)] font-semibold text-xs">Open →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="v-card">
            <div className="text-sm font-bold mb-3">Redemptions</div>
            {theirRedemptions.length === 0 ? (
              <div className="text-xs text-[var(--vie-ink-muted)]">No redemptions yet.</div>
            ) : (
              <div className="space-y-2">
                {theirRedemptions.map(({ r, reward }) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{reward?.name ?? "—"}</div>
                      <div className="text-xs text-[var(--vie-ink-muted)]">{relativeDate(r.createdAt)} · {r.status}</div>
                    </div>
                    <div className="text-sm font-bold v-numeric text-[var(--vie-error)]">−{formatPoints(r.pointCost)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="v-card">
            <div className="text-sm font-bold mb-3">Points ledger</div>
            {theirLedger.length === 0 ? (
              <div className="text-xs text-[var(--vie-ink-muted)]">No ledger entries yet.</div>
            ) : (
              <div className="space-y-2">
                {theirLedger.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm border-b border-[var(--vie-line)] last:border-b-0 pb-1.5">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold capitalize">{l.reason}</div>
                      <div className="text-[10px] text-[var(--vie-ink-muted)] truncate">{new Date(l.createdAt).toLocaleString("hr-HR")} · {l.note ?? "—"}</div>
                    </div>
                    <div className={`font-bold v-numeric ml-3 flex-shrink-0 ${l.delta >= 0 ? "text-[var(--vie-success)]" : "text-[var(--vie-error)]"}`}>
                      {l.delta >= 0 ? "+" : ""}{formatPoints(l.delta)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {theirAudit.length > 0 && (
            <div className="v-card">
              <div className="text-sm font-bold mb-3 flex items-center gap-2"><ScrollText size={14} /> Audit (this installer)</div>
              <div className="space-y-1">
                {theirAudit.map((a) => (
                  <div key={a.id} className="text-xs flex items-baseline gap-2">
                    <span className="text-[var(--vie-ink-muted)] whitespace-nowrap">{relativeDate(a.createdAt)}</span>
                    <code className="text-[var(--vie-ink)] font-mono">{a.action}</code>
                    <span className="text-[var(--vie-ink-muted)] truncate">by {a.actorEmail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-[var(--vie-ink-muted)] mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{label}</div>
        <div className="font-medium truncate">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "warn" | "error" | "info" | "brand" }) {
  const colours: Record<string, string> = {
    success: "text-[var(--vie-success)]",
    warn: "text-[var(--vie-warn)]",
    error: "text-[var(--vie-error)]",
    info: "text-[var(--vie-info)]",
    brand: "text-[var(--vie-orange)]",
  };
  return (
    <div className="v-card v-card-tight">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{label}</div>
      <div className={`text-xl font-bold mt-0.5 v-numeric ${tone ? colours[tone] : ""}`}>{value}</div>
    </div>
  );
}
