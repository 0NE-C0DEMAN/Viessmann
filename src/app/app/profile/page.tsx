import { redirect } from "next/navigation";
import { db } from "@/db";
import { installers, redemptions, rewards, pointsLedger } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { ProfileForm } from "./profile-form";
import { LogoutButton } from "@/components/logout-button";
import { formatPoints } from "@/lib/money";
import { Calendar, MapPin, Phone, Mail, Hash } from "lucide-react";

export default async function ProfilePage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const me = (await db.select().from(installers).where(eq(installers.id, s.installerId)).limit(1))[0];

  const balanceRows = (await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS balance FROM points_ledger WHERE installer_id = ${s.installerId}`,
  )) as unknown as Array<{ balance: number }>;
  const balance = balanceRows[0]?.balance ?? 0;

  const lifetimeEarnedRows = (await db.execute(
    sql`SELECT COALESCE(SUM(delta), 0)::int AS pts FROM points_ledger WHERE installer_id = ${s.installerId} AND reason = 'accrual'`,
  )) as unknown as Array<{ pts: number }>;
  const lifetimeEarned = lifetimeEarnedRows[0]?.pts ?? 0;

  const myRedemptions = await db
    .select({ r: redemptions, reward: rewards })
    .from(redemptions)
    .leftJoin(rewards, eq(rewards.id, redemptions.rewardId))
    .where(eq(redemptions.installerId, s.installerId))
    .orderBy(desc(redemptions.createdAt))
    .limit(20);

  const recentLedger = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.installerId, s.installerId))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(10);

  const tier = balance >= 25000 ? "Platinum" : balance >= 8000 ? "Gold" : balance >= 2000 ? "Silver" : "Bronze";

  return (
    <div className="space-y-4 v-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <div className="v-card text-center">
        <div className="v-logo v-logo-lg mx-auto">{(me.companyName?.[0] ?? "?").toUpperCase()}</div>
        <div className="font-bold text-lg mt-3">{me.companyName}</div>
        <div className="text-xs text-[var(--vie-ink-muted)] flex items-center justify-center gap-1 mt-0.5"><Hash size={11} /> OIB {me.oib}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="v-pill v-pill-brand">{tier} tier</span>
          <span className="v-pill v-pill-muted">Member since {new Date(me.createdAt).toLocaleDateString("hr-HR", { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="v-card v-card-tight">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">Current balance</div>
          <div className="text-xl font-bold v-numeric mt-1">{formatPoints(balance)}</div>
        </div>
        <div className="v-card v-card-tight">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">Lifetime earned</div>
          <div className="text-xl font-bold v-numeric mt-1">{formatPoints(lifetimeEarned)}</div>
        </div>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3">Business details</div>
        <div className="space-y-2 text-sm">
          <Row icon={<MapPin size={14} />} label="Address">{me.address ?? "—"}{me.city ? `, ${me.postalCode ?? ""} ${me.city}` : ""}</Row>
          <Row icon={<Mail size={14} />} label="Email">{me.email}</Row>
          <Row icon={<Phone size={14} />} label="Phone">{me.phone ?? "—"}</Row>
          <Row icon={<Calendar size={14} />} label="Joined">{new Date(me.createdAt).toLocaleDateString("hr-HR")}</Row>
        </div>
      </div>

      <ProfileForm installer={{
        companyName: me.companyName,
        address: me.address ?? "",
        city: me.city ?? "",
        postalCode: me.postalCode ?? "",
        phone: me.phone ?? "",
      }} />

      <div className="v-card">
        <div className="text-sm font-bold mb-3">My redemptions</div>
        {myRedemptions.length === 0 ? (
          <div className="text-xs text-[var(--vie-ink-muted)]">No redemptions yet.</div>
        ) : (
          <div className="space-y-2">
            {myRedemptions.map(({ r, reward }) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{reward?.name ?? "—"}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)]">{new Date(r.createdAt).toLocaleDateString("hr-HR")} · {r.status}</div>
                </div>
                <div className="text-sm font-bold v-numeric text-[var(--vie-error)]">−{formatPoints(r.pointCost)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3">Recent points activity</div>
        {recentLedger.length === 0 ? (
          <div className="text-xs text-[var(--vie-ink-muted)]">No activity yet.</div>
        ) : (
          <div className="space-y-2">
            {recentLedger.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-xs font-medium capitalize">{l.reason}</div>
                  <div className="text-[10px] text-[var(--vie-ink-muted)]">{new Date(l.createdAt).toLocaleString("hr-HR")} · {l.note ?? "—"}</div>
                </div>
                <div className={`font-bold v-numeric ${l.delta >= 0 ? "text-[var(--vie-success)]" : "text-[var(--vie-error)]"}`}>
                  {l.delta >= 0 ? "+" : ""}{formatPoints(l.delta)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LogoutButton variant="danger" />
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
