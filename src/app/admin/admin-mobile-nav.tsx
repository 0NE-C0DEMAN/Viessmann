"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Queue", icon: LayoutDashboard },
  { href: "/admin/installers", label: "Installers", icon: Users },
  { href: "/admin/wholesalers", label: "Wholesalers", icon: Building2 },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/fulfillment", label: "Fulfillment", icon: PackageCheck },
  { href: "/admin/intelligence", label: "Intelligence", icon: BarChart3 },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminMobileNav({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden p-2 rounded-lg text-[var(--vie-ink-soft)] hover:bg-[var(--vie-paper)] hover:text-[var(--vie-ink)]"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 v-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[var(--vie-paper-elev)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--vie-line)]">
              <div>
                <div className="text-xs text-[var(--vie-ink-muted)]">Signed in as</div>
                <div className="font-semibold text-sm truncate">{email}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg text-[var(--vie-ink-soft)] hover:bg-[var(--vie-paper)] hover:text-[var(--vie-ink)]"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--vie-ink)] hover:bg-[var(--vie-paper)]"
                >
                  <Icon size={16} className="text-[var(--vie-ink-soft)]" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-3 border-t border-[var(--vie-line)] v-safe-bottom">
              <div className="text-[10px] text-[var(--vie-ink-muted)] uppercase tracking-wider mb-2 px-3">
                Croatia · Pilot
              </div>
              <button
                onClick={logout}
                className="v-btn v-btn-danger w-full"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
