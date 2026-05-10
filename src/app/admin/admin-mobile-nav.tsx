"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Megaphone,
  PackageCheck,
  Settings,
  ScrollText,
  Gift,
  LogOut,
  Shield,
} from "lucide-react";

export function AdminMobileNav({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  // The drawer is portaled to document.body to escape `backdrop-filter` on
  // ancestor elements (which otherwise creates a containing block for
  // `position: fixed`, trapping the drawer inside the sticky header).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock page scroll while open + close on Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Close drawer when route changes (covers any nav we miss in onClick).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const SECTIONS = [
    {
      title: t("admin.nav.daily"),
      items: [
        { href: "/admin", label: t("admin.tab.queue"), description: t("admin.queue.desc"), icon: LayoutDashboard },
        { href: "/admin/fulfillment", label: t("admin.tab.fulfillment"), description: t("admin.fulfillment.desc"), icon: PackageCheck },
      ],
    },
    {
      title: t("admin.nav.directory"),
      items: [
        { href: "/admin/installers", label: t("admin.tab.installers"), description: t("admin.installers.desc"), icon: Users },
        { href: "/admin/wholesalers", label: t("admin.tab.wholesalers"), description: t("admin.wholesalers.desc"), icon: Building2 },
      ],
    },
    {
      title: t("admin.nav.config"),
      items: [
        { href: "/admin/campaigns", label: t("admin.tab.campaigns"), description: t("admin.campaigns.desc"), icon: Megaphone },
        { href: "/admin/rewards", label: t("admin.tab.rewards"), description: t("admin.rewards.desc"), icon: Gift },
      ],
    },
    {
      title: t("admin.nav.reports"),
      items: [
        { href: "/admin/intelligence", label: t("admin.tab.intelligence"), description: t("admin.intelligence.desc"), icon: BarChart3 },
        { href: "/admin/audit", label: t("admin.tab.audit"), description: t("admin.audit.desc"), icon: ScrollText },
        { href: "/admin/settings", label: t("admin.tab.settings"), description: t("admin.settings.desc"), icon: Settings },
      ],
    },
  ];

  // Backdrop + drawer panel — portaled to document.body so they escape any
  // ancestor that creates a containing block (sticky header has
  // `backdrop-filter`, which would otherwise trap `position: fixed`).
  const overlay = (
    <>
      <div
        className={`lg:hidden fixed inset-0 z-[100] bg-black/45 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-[101] w-[88%] max-w-[360px] h-screen bg-[var(--vie-paper-elev)] flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.18)] transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("admin.nav.label")}
        aria-hidden={!open}
      >
        <div className="v-safe-top">
          <div className="flex items-start justify-between p-4 pb-3 border-b border-[var(--vie-line)]">
            <div className="min-w-0 flex-1 pr-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--vie-ink-muted)]">
                {t("admin.nav.brand")}
              </div>
              <div className="font-semibold text-sm truncate mt-0.5">{email}</div>
              <div className="text-[10px] text-[var(--vie-ink-muted)] flex items-center gap-1 mt-1">
                <Shield size={10} /> {t("admin.nav.region")}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("admin.nav.closeMenu")}
              className="p-2 rounded-lg text-[var(--vie-ink-soft)] hover:bg-[var(--vie-paper)] hover:text-[var(--vie-ink)] -mt-1 -mr-1 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((section) => (
            <div key={section.title} className="px-2 pt-3 pb-1">
              <div className="px-3 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--vie-ink-muted)]">
                {section.title}
              </div>
              {section.items.map(({ href, label, description, icon: Icon }) => {
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? "bg-[var(--vie-red-light)] text-[var(--vie-red-dark)]"
                        : "text-[var(--vie-ink)] hover:bg-[var(--vie-paper)] active:bg-[var(--vie-line)]"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-[var(--vie-red-dark)]" : "text-[var(--vie-ink-soft)]"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight">{label}</div>
                      <div className="text-[11px] text-[var(--vie-ink-muted)] truncate">{description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--vie-line)] v-safe-bottom">
          <button onClick={logout} className="v-btn v-btn-danger w-full">
            <LogOut size={16} /> {t("common.signOut")}
          </button>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("admin.nav.openMenu")}
        aria-expanded={open}
        className="lg:hidden p-2 rounded-lg text-[var(--vie-ink-soft)] hover:bg-[var(--vie-paper)] hover:text-[var(--vie-ink)] active:bg-[var(--vie-line)] transition-colors"
      >
        <Menu size={22} />
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
