import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.installerId) redirect("/login");
  if (s.role !== "admin") redirect("/app");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vie-paper)]">
      <header className="sticky top-0 z-30 bg-white border-b border-[var(--vie-line)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--vie-orange)]" />
            <span className="font-bold tracking-tight">Viessmann <span className="text-[var(--vie-orange)]">Admin</span></span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:text-[var(--vie-orange)]">Queue</Link>
            <Link href="/admin/installers" className="hover:text-[var(--vie-orange)]">Installers</Link>
            <Link href="/admin/intelligence" className="hover:text-[var(--vie-orange)]">Intelligence</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">{children}</main>
    </div>
  );
}
