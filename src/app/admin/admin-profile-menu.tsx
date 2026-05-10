"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, Shield } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function AdminProfileMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="hidden lg:block relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-[var(--vie-ink)] text-white font-bold text-sm flex items-center justify-center hover:scale-105 transition-transform"
        title={email}
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-64 v-card shadow-lg z-50 v-fade-in">
          <div className="text-xs text-[var(--vie-ink-muted)]">{t("admin.menu.signedIn")}</div>
          <div className="font-semibold text-sm truncate">{email}</div>
          <div className="text-[10px] text-[var(--vie-ink-muted)] uppercase tracking-wider mt-1.5 flex items-center gap-1">
            <Shield size={10} /> {t("admin.nav.region")}
          </div>
          <hr className="v-divider" />
          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--vie-paper)] text-sm"
          >
            <Settings size={14} /> {t("admin.tab.settings")}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--vie-error-bg)] text-sm text-[var(--vie-error)]"
          >
            <LogOut size={14} /> {t("common.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
