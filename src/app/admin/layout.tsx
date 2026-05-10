import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminProfileMenu } from "./admin-profile-menu";
import { getT } from "@/lib/i18n/server";
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Megaphone,
  PackageCheck,
  ScrollText,
  Gift,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role !== "admin") redirect("/app");
  const { t } = await getT();

  // Tabs shown on desktop. Settings and Sign out are moved to the profile
  // dropdown on the right; the mobile drawer surfaces all of them.
  const DESKTOP_TABS = [
    { href: "/admin", label: t("admin.tab.queue"), Icon: LayoutDashboard },
    { href: "/admin/installers", label: t("admin.tab.installers"), Icon: Users },
    { href: "/admin/wholesalers", label: t("admin.tab.wholesalers"), Icon: Building2 },
    { href: "/admin/campaigns", label: t("admin.tab.campaigns"), Icon: Megaphone },
    { href: "/admin/rewards", label: t("admin.tab.rewards"), Icon: Gift },
    { href: "/admin/fulfillment", label: t("admin.tab.fulfillment"), Icon: PackageCheck },
    { href: "/admin/intelligence", label: t("admin.tab.intelligence"), Icon: BarChart3 },
    { href: "/admin/audit", label: t("admin.tab.audit"), Icon: ScrollText },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vie-paper)]">
      <header className="sticky top-0 z-30 bg-[var(--vie-paper-elev)]/95 backdrop-blur border-b border-[var(--vie-line)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="inline-flex items-center min-w-0">
            <Brand size="md" subtitle={t("brand.admin")} />
          </Link>

          {/* Desktop horizontal nav */}
          <nav className="hidden lg:flex items-center gap-0.5 text-sm flex-1 justify-end">
            {DESKTOP_TABS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[var(--vie-ink-soft)] hover:bg-[var(--vie-paper)] hover:text-[var(--vie-ink)]"
              >
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <AdminProfileMenu email={s.email!} />
            <LogoutButton />
            <AdminMobileNav email={s.email!} />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full v-fade-in">{children}</main>
    </div>
  );
}
