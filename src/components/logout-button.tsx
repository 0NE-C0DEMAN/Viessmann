"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ variant = "header" }: { variant?: "header" | "danger" }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  if (variant === "danger") {
    return (
      <button onClick={logout} className="v-btn v-btn-danger w-full">
        <LogOut size={16} /> Sign out
      </button>
    );
  }
  return (
    <button onClick={logout} className="text-[var(--vie-ink-soft)] hover:text-[var(--vie-error)] flex items-center gap-1 text-sm" title="Sign out">
      <LogOut size={16} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
