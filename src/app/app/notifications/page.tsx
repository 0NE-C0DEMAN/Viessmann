import { redirect } from "next/navigation";
import { db } from "@/db";
import { receipts, redemptions, rewards, pointsLedger, auditLog } from "@/db/schema";
import { desc, eq, inArray, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { CheckCircle2, AlertTriangle, XCircle, Gift, Bell, RotateCcw, Sparkles, Coins } from "lucide-react";
import Link from "next/link";
import { relativeDate } from "@/lib/utils";
import { formatPoints } from "@/lib/money";

export default async function NotificationsPage() {
  const s = await getSession();
  if (!s.installerId) redirect("/login");

  const [recentReceipts, recentRedemptions, recentLedger, tierEvents] = await Promise.all([
    db.select().from(receipts).where(eq(receipts.installerId, s.installerId)).orderBy(desc(receipts.createdAt)).limit(20),
    db
      .select({ r: redemptions, reward: rewards })
      .from(redemptions)
      .leftJoin(rewards, eq(rewards.id, redemptions.rewardId))
      .where(eq(redemptions.installerId, s.installerId))
      .orderBy(desc(redemptions.createdAt))
      .limit(10),
    db
      .select()
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.installerId, s.installerId),
          // Reversals + admin manual adjustments. We skip 'accrual' and 'redemption'
          // because the receipt/redemption tables already produce notifications for those.
          inArray(pointsLedger.reason, ["reversal", "adjustment"]),
        ),
      )
      .orderBy(desc(pointsLedger.createdAt))
      .limit(20),
    db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.action, "tier.changed"), eq(auditLog.entityId, s.installerId)))
      .orderBy(desc(auditLog.createdAt))
      .limit(10),
  ]);

  const myLedger = recentLedger;
  const myTierEvents = tierEvents;

  type Notif = {
    id: string;
    when: Date;
    icon: React.ReactNode;
    title: string;
    body: string;
    href?: string;
    tone: "success" | "warn" | "error" | "info" | "brand";
  };

  const items: Notif[] = [];

  for (const r of recentReceipts) {
    if (r.status === "approved") {
      items.push({
        id: `r-${r.id}`,
        when: r.createdAt!,
        icon: <CheckCircle2 size={18} />,
        title: `Approved: ${r.invoiceNumber ?? "invoice"}`,
        body: `+${formatPoints(r.pointsAwarded)} pts credited from ${r.wholesalerName ?? "wholesaler"}.`,
        href: `/app/receipts/${r.id}`,
        tone: "success",
      });
    } else if (r.status === "needs_review") {
      items.push({
        id: `r-${r.id}`,
        when: r.createdAt!,
        icon: <AlertTriangle size={18} />,
        title: `Pending review: ${r.invoiceNumber ?? "invoice"}`,
        body: "We'll get back to you within 24 hours.",
        href: `/app/receipts/${r.id}`,
        tone: "warn",
      });
    } else if (r.status === "rejected" || r.status === "duplicate") {
      items.push({
        id: `r-${r.id}`,
        when: r.createdAt!,
        icon: <XCircle size={18} />,
        title: `${r.status === "duplicate" ? "Duplicate" : "Rejected"}: ${r.invoiceNumber ?? "invoice"}`,
        body: r.reviewerNote ?? (r.status === "duplicate" ? "Already submitted previously." : "Could not award points."),
        href: `/app/receipts/${r.id}`,
        tone: "error",
      });
    }
  }

  for (const { r, reward } of recentRedemptions) {
    items.push({
      id: `red-${r.id}`,
      when: r.createdAt!,
      icon: <Gift size={18} />,
      title: `Redeemed: ${reward?.name ?? "—"}`,
      body: `−${formatPoints(r.pointCost)} pts. Status: ${r.status}.`,
      tone: "brand",
    });
  }

  for (const l of myLedger) {
    if (l.reason === "reversal") {
      items.push({
        id: `l-${l.id}`,
        when: l.createdAt!,
        icon: <RotateCcw size={18} />,
        title: `Points reversed by Viessmann`,
        body: `${l.delta >= 0 ? "+" : ""}${formatPoints(l.delta)} pts. ${l.note ?? ""}`,
        href: l.receiptId ? `/app/receipts/${l.receiptId}` : undefined,
        tone: l.delta >= 0 ? "info" : "error",
      });
    } else if (l.reason === "adjustment") {
      items.push({
        id: `l-${l.id}`,
        when: l.createdAt!,
        icon: <Coins size={18} />,
        title: `Points adjusted by Viessmann`,
        body: `${l.delta >= 0 ? "+" : ""}${formatPoints(l.delta)} pts. ${l.note ?? "No reason given"}.`,
        tone: l.delta >= 0 ? "success" : "warn",
      });
    }
  }

  for (const e of myTierEvents) {
    const p = e.payload as { from?: string; to?: string } | null;
    items.push({
      id: `t-${e.id}`,
      when: e.createdAt!,
      icon: <Sparkles size={18} />,
      title: `Welcome to ${p?.to ?? "a new tier"}!`,
      body: `You moved up from ${p?.from ?? "Bronze"} — enjoy the new rewards.`,
      href: "/app/rewards",
      tone: "brand",
    });
  }

  items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <div className="space-y-3 v-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>

      {items.length === 0 ? (
        <div className="v-card text-center py-10">
          <Bell className="mx-auto text-[var(--vie-ink-muted)]" size={28} />
          <div className="font-semibold text-sm mt-2">All quiet here</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">Submit your first invoice to see updates.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotifRow key={n.id} {...n} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotifRow({ icon, title, body, href, tone, when }: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href?: string;
  tone: "success" | "warn" | "error" | "info" | "brand";
  when: Date;
}) {
  const tones: Record<string, string> = {
    success: "bg-[var(--vie-success-bg)] text-[var(--vie-success)]",
    warn: "bg-[var(--vie-warn-bg)] text-[var(--vie-warn)]",
    error: "bg-[var(--vie-error-bg)] text-[var(--vie-error)]",
    info: "bg-[var(--vie-info-bg)] text-[var(--vie-info)]",
    brand: "bg-[var(--vie-red-light)] text-[var(--vie-red-dark)]",
  };
  const Wrapper: React.ElementType = href ? Link : "div";
  return (
    <Wrapper {...(href ? { href } : {})} className={`v-card v-card-tight flex items-start gap-3 ${href ? "v-card-interactive" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{title}</div>
        <div className="text-xs text-[var(--vie-ink-soft)]">{body}</div>
        <div className="text-[10px] text-[var(--vie-ink-muted)] mt-0.5">{relativeDate(when)}</div>
      </div>
    </Wrapper>
  );
}
