"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function ProfileMenu({ email, companyName }: { email: string; companyName: string }) {
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

  const initial = (companyName?.[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] font-bold text-sm flex items-center justify-center hover:scale-105 transition-transform"
        title={companyName}
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-64 v-card shadow-lg z-50 v-fade-in">
          <div className="text-xs text-[var(--vie-ink-muted)]">{t("profileMenu.signedIn")}</div>
          <div className="font-semibold text-sm truncate">{companyName}</div>
          <div className="text-xs text-[var(--vie-ink-soft)] truncate">{email}</div>
          <hr className="v-divider" />
          <Link href="/app/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--vie-paper)] text-sm">
            <User size={14} /> {t("profileMenu.profile")}
          </Link>
          <Link href="/app/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--vie-paper)] text-sm">
            <Settings size={14} /> {t("profileMenu.settings")}
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--vie-error-bg)] text-sm text-[var(--vie-error)]">
            <LogOut size={14} /> {t("common.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
