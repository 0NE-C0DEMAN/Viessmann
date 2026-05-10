import { redirect } from "next/navigation";
import { db } from "@/db";
import { redemptions, rewards, pointsLedger } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { ProfileForm } from "./profile-form";
import { LogoutButton } from "@/components/logout-button";
import { formatPoints } from "@/lib/money";
import { Calendar, MapPin, Phone, Mail, Hash } from "lucide-react";
import { getT } from "@/lib/i18n/server";

interface ProfileAggregate {
  id: string;
  email: string;
  oib: string;
  company_name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  created_at: string;
  balance: number;
  lifetime_earned: number;
}

export default async function ProfilePage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  const { t, locale } = await getT();
  const dateLocale = locale === "hr" ? "hr-HR" : "en-GB";

  // One round trip for installer + balance + lifetime earned.
  const aggRows = (await db.execute(sql`
    SELECT
      i.id, i.email, i.oib, i.company_name, i.address, i.city, i.postal_code, i.phone, i.created_at,
      COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = i.id), 0)::int AS balance,
      COALESCE((SELECT SUM(delta) FROM points_ledger WHERE installer_id = i.id AND reason = 'accrual'), 0)::int AS lifetime_earned
    FROM installers i
    WHERE i.id = ${s.installerId}
  `)) as unknown as ProfileAggregate[];
  const me = aggRows[0];
  if (!me) redirect("/login");

  // Redemptions and ledger run in parallel.
  const [myRedemptions, recentLedger] = await Promise.all([
    db
      .select({ r: redemptions, reward: rewards })
      .from(redemptions)
      .leftJoin(rewards, eq(rewards.id, redemptions.rewardId))
      .where(eq(redemptions.installerId, s.installerId))
      .orderBy(desc(redemptions.createdAt))
      .limit(20),
    db
      .select()
      .from(pointsLedger)
      .where(eq(pointsLedger.installerId, s.installerId))
      .orderBy(desc(pointsLedger.createdAt))
      .limit(10),
  ]);

  const tier = me.balance >= 25000 ? "Platinum" : me.balance >= 8000 ? "Gold" : me.balance >= 2000 ? "Silver" : "Bronze";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h1>

      <div className="v-card text-center">
        <div className="v-logo v-logo-lg mx-auto">{(me.company_name?.[0] ?? "?").toUpperCase()}</div>
        <div className="font-bold text-lg mt-3">{me.company_name}</div>
        <div className="text-xs text-[var(--vie-ink-muted)] flex items-center justify-center gap-1 mt-0.5"><Hash size={11} /> OIB {me.oib}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="v-pill v-pill-brand">{t(`tier.${tier}`)} {t("profile.tier")}</span>
          <span className="v-pill v-pill-muted">{t("profile.memberSince")} {new Date(me.created_at).toLocaleDateString(dateLocale, { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="v-card v-card-tight">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{t("profile.currentBalance")}</div>
          <div className="text-xl font-bold v-numeric mt-1">{formatPoints(me.balance)}</div>
        </div>
        <div className="v-card v-card-tight">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--vie-ink-muted)]">{t("profile.lifetimeEarned")}</div>
          <div className="text-xl font-bold v-numeric mt-1">{formatPoints(me.lifetime_earned)}</div>
        </div>
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3">{t("profile.businessDetails")}</div>
        <div className="space-y-2 text-sm">
          <Row icon={<MapPin size={14} />} label={t("profile.address")}>{me.address ?? "—"}{me.city ? `, ${me.postal_code ?? ""} ${me.city}` : ""}</Row>
          <Row icon={<Mail size={14} />} label={t("profile.email")}>{me.email}</Row>
          <Row icon={<Phone size={14} />} label={t("profile.phone")}>{me.phone ?? "—"}</Row>
          <Row icon={<Calendar size={14} />} label={t("profile.joined")}>{new Date(me.created_at).toLocaleDateString(dateLocale)}</Row>
        </div>
      </div>

      <ProfileForm installer={{
        companyName: me.company_name,
        address: me.address ?? "",
        city: me.city ?? "",
        postalCode: me.postal_code ?? "",
        phone: me.phone ?? "",
      }} />

      <div className="v-card">
        <div className="text-sm font-bold mb-3">{t("profile.myRedemptions")}</div>
        {myRedemptions.length === 0 ? (
          <div className="text-xs text-[var(--vie-ink-muted)]">{t("profile.noRedemptions")}</div>
        ) : (
          <div className="space-y-2">
            {myRedemptions.map(({ r, reward }) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{reward?.name ?? "—"}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] truncate">{new Date(r.createdAt).toLocaleDateString(dateLocale)} · {r.status}</div>
                </div>
                <div className="text-sm font-bold v-numeric text-[var(--vie-error)] flex-shrink-0">−{formatPoints(r.pointCost)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="v-card">
        <div className="text-sm font-bold mb-3">{t("profile.recentActivity")}</div>
        {recentLedger.length === 0 ? (
          <div className="text-xs text-[var(--vie-ink-muted)]">{t("profile.noActivity")}</div>
        ) : (
          <div className="space-y-2">
            {recentLedger.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium capitalize">{t(`profile.ledger.${l.reason}`)}</div>
                  <div className="text-[10px] text-[var(--vie-ink-muted)] truncate">{new Date(l.createdAt).toLocaleString(dateLocale)} · {l.note ?? "—"}</div>
                </div>
                <div className={`font-bold v-numeric flex-shrink-0 ${l.delta >= 0 ? "text-[var(--vie-success)]" : "text-[var(--vie-error)]"}`}>
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
