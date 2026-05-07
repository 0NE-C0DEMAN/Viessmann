import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import { LayoutDashboard, Users, Building2, BarChart3, Megaphone, PackageCheck, Settings, ScrollText, Gift } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role !== "admin") redirect("/app");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vie-paper)]">
      <header className="sticky top-0 z-30 bg-[var(--vie-paper-elev)]/95 backdrop-blur border-b border-[var(--vie-line)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="v-logo">V+</span>
            <div>
              <div className="font-bold tracking-tight leading-tight">Viessmann <span className="text-[var(--vie-orange)]">Admin</span></div>
              <div className="text-[10px] text-[var(--vie-ink-muted)] uppercase tracking-wider">Croatia · Pilot</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavTab href="/admin" label="Queue" icon={<LayoutDashboard size={14} />} />
            <NavTab href="/admin/installers" label="Installers" icon={<Users size={14} />} />
            <NavTab href="/admin/wholesalers" label="Wholesalers" icon={<Building2 size={14} />} />
            <NavTab href="/admin/campaigns" label="Campaigns" icon={<Megaphone size={14} />} />
            <NavTab href="/admin/rewards" label="Rewards" icon={<Gift size={14} />} />
            <NavTab href="/admin/fulfillment" label="Fulfillment" icon={<PackageCheck size={14} />} />
            <NavTab href="/admin/intelligence" label="Intelligence" icon={<BarChart3 size={14} />} />
            <NavTab href="/admin/audit" label="Audit" icon={<ScrollText size={14} />} />
            <NavTab href="/admin/settings" label="Settings" icon={<Settings size={14} />} />
            <span className="mx-2 h-6 w-px bg-[var(--vie-line)]" />
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full v-fade-in">{children}</main>
    </div>
  );
}

function NavTab({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[var(--vie-ink-soft)] hover:bg-[var(--vie-paper)] hover:text-[var(--vie-ink)]">
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
