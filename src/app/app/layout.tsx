import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { Home, Upload, Gift, History as HistoryIcon, Bell, User } from "lucide-react";
import { ProfileMenu } from "@/components/profile-menu";
import { Brand } from "@/components/brand";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role === "admin") redirect("/admin");

  // Notification badge: count of submissions still pending review for this installer.
  const pendingRows = (await db.execute(
    sql`SELECT COUNT(*)::int AS n FROM receipts WHERE installer_id = ${s.installerId} AND status = 'needs_review'`,
  )) as unknown as Array<{ n: number }>;
  const pendingCount = pendingRows[0]?.n ?? 0;

  // Suppress unused warnings (we may use these directly later).
  void receipts; void and; void eq; void gt;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vie-paper)]">
      <header className="sticky top-0 z-30 bg-[var(--vie-paper-elev)]/95 backdrop-blur border-b border-[var(--vie-line)]">
        <div className="max-w-md w-full mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/app" prefetch className="flex items-center">
            <Brand size="sm" subtitle="Loyalty" />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/app/notifications" prefetch className="relative p-2 rounded-lg hover:bg-[var(--vie-line)] text-[var(--vie-ink-soft)] hover:text-[var(--vie-ink)] transition-colors" title={pendingCount > 0 ? `${pendingCount} pending` : "Notifications"}>
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--vie-red)] text-white text-[10px] font-bold flex items-center justify-center v-numeric">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </Link>
            <ProfileMenu email={s.email!} companyName={s.companyName ?? s.email!} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-24 pt-3">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--vie-paper-elev)] border-t border-[var(--vie-line)] z-40 v-safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto grid grid-cols-5">
        <NavLink href="/app" label="Home" icon={<Home size={20} />} />
        <NavLink href="/app/history" label="History" icon={<HistoryIcon size={20} />} />
        <NavSubmit />
        <NavLink href="/app/rewards" label="Rewards" icon={<Gift size={20} />} />
        <NavLink href="/app/profile" label="Profile" icon={<User size={20} />} />
      </div>
    </nav>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} prefetch className="relative flex flex-col items-center justify-center py-2.5 gap-0.5 text-[var(--vie-ink-soft)] hover:text-[var(--vie-red)] transition-colors">
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
}

function NavSubmit() {
  return (
    <div className="flex items-center justify-center">
      <Link
        href="/app/submit"
        prefetch
        className="-mt-6 w-14 h-14 rounded-full bg-[var(--vie-red)] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(255,111,0,0.35)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Submit invoice"
      >
        <Upload size={22} />
      </Link>
    </div>
  );
}
