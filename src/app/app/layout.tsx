import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { Home, Upload, Gift, History as HistoryIcon, Bell, User } from "lucide-react";
import { ProfileMenu } from "@/components/profile-menu";
import { db } from "@/db";
import { installers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role === "admin") redirect("/admin");

  const me = (await db.select().from(installers).where(eq(installers.id, s.installerId)).limit(1))[0];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vie-paper)]">
      <header className="sticky top-0 z-30 bg-[var(--vie-paper-elev)]/95 backdrop-blur border-b border-[var(--vie-line)]">
        <div className="max-w-md w-full mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="v-logo">V+</span>
            <span className="font-bold tracking-tight">Viessmann <span className="text-[var(--vie-orange)]">Loyalty</span></span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/app/notifications" className="p-2 rounded-lg hover:bg-[var(--vie-line)] text-[var(--vie-ink-soft)] hover:text-[var(--vie-ink)] transition-colors" title="Notifications">
              <Bell size={18} />
            </Link>
            <ProfileMenu email={me.email} companyName={me.companyName} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-24 pt-3 v-fade-in">
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
    <Link href={href} className="relative flex flex-col items-center justify-center py-2.5 gap-0.5 text-[var(--vie-ink-soft)] hover:text-[var(--vie-orange)] transition-colors">
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
        className="-mt-6 w-14 h-14 rounded-full bg-[var(--vie-orange)] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(255,111,0,0.35)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Submit invoice"
      >
        <Upload size={22} />
      </Link>
    </div>
  );
}
