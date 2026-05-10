"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function LogoutButton({ variant = "header" }: { variant?: "header" | "danger" }) {
  const router = useRouter();
  const { t } = useT();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  if (variant === "danger") {
    return (
      <button onClick={logout} className="v-btn v-btn-danger w-full">
        <LogOut size={16} /> {t("common.signOut")}
      </button>
    );
  }
  return (
    <button
      onClick={logout}
      title={t("common.signOut")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-[var(--vie-ink-soft)] hover:text-[var(--vie-error)] hover:bg-[var(--vie-error-bg)] active:bg-[var(--vie-error-bg)] transition-colors"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">{t("common.signOut")}</span>
    </button>
  );
}
