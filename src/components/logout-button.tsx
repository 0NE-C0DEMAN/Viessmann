"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={logout} className="text-[var(--vie-ink-soft)] hover:text-[var(--vie-error)] flex items-center gap-1 text-sm" title="Sign out">
      <LogOut size={16} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
