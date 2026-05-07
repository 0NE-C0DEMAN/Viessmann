import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { Home, Upload, Gift, History as HistoryIcon, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role === "admin") redirect("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vie-paper)]">
      <header className="sticky top-0 z-30 bg-white border-b border-[var(--vie-line)]">
        <div className="max-w-md w-full mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--vie-orange)]" />
            <span className="font-bold text-sm tracking-tight">Viessmann <span className="text-[var(--vie-orange)]">B2B</span></span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-24 pt-3 w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--vie-line)] z-40 v-safe-bottom">
        <div className="max-w-md mx-auto grid grid-cols-4 text-xs">
          <NavLink href="/app" label="Home"><Home size={20} /></NavLink>
          <NavLink href="/app/submit" label="Submit"><Upload size={20} /></NavLink>
          <NavLink href="/app/history" label="History"><HistoryIcon size={20} /></NavLink>
          <NavLink href="/app/rewards" label="Rewards"><Gift size={20} /></NavLink>
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center py-2.5 gap-0.5 text-[var(--vie-ink-soft)] hover:text-[var(--vie-orange)]">
      {children}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
