"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push(json.redirect || "/app");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  function quick(em: string, pwd = "demo1234") {
    setEmail(em);
    setPassword(pwd);
  }

  const demoUsers = [
    { email: "ivo@instalaterm.hr", company: "Instalaterm d.o.o.", city: "Zagreb", oib: "98765432109" },
    { email: "marko@energomont.hr", company: "Energo-Mont d.o.o.", city: "Osijek", oib: "11223344556" },
    { email: "ana@termoprojekt.hr", company: "Termo-Projekt d.o.o.", city: "Zagreb", oib: "12345678901" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand size="md" subtitle="Loyalty" />
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-md w-full mx-auto pt-2 v-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-[var(--vie-ink-soft)] mt-1">Sign in to submit invoices and check your balance.</p>

        <form onSubmit={submit} className="mt-7 v-card space-y-4">
          <div>
            <label className="v-label">Email</label>
            <input className="v-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.hr" />
          </div>
          <div>
            <label className="v-label">Password</label>
            <input className="v-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="v-btn v-btn-primary w-full">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <>Sign in <ArrowRight size={16} /></>}
          </button>
          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-[var(--vie-ink-muted)] hover:text-[var(--vie-ink)]">Forgot password?</Link>
            <Link href="/signup" className="text-[var(--vie-red)] font-semibold">Register</Link>
          </div>
        </form>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="v-pill v-pill-brand text-[10px]">Demo only</span>
            <span className="text-xs text-[var(--vie-ink-muted)]">Try the prototype with a sample account</span>
          </div>
          <div className="grid gap-2">
            {demoUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => quick(u.email)}
                className="v-card v-card-tight v-card-interactive text-left flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {u.company[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{u.company}</div>
                  <div className="text-xs text-[var(--vie-ink-muted)] truncate v-numeric">{u.city} · OIB {u.oib}</div>
                </div>
                <span className="text-xs text-[var(--vie-ink-muted)]">Installer</span>
              </button>
            ))}
            <button
              onClick={() => quick("admin@viessmann.com", "admin1234")}
              className="v-card v-card-tight v-card-interactive text-left flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--vie-ink)] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                V
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">Viessmann admin</div>
                <div className="text-xs text-[var(--vie-ink-muted)] truncate">Review queue · campaigns · intelligence</div>
              </div>
              <span className="text-xs text-[var(--vie-ink-muted)]">Admin</span>
            </button>
          </div>
          <p className="text-[11px] text-[var(--vie-ink-muted)] mt-3 px-1">
            All passwords: <code className="px-1 py-0.5 bg-[var(--vie-line)] rounded">demo1234</code> · admin: <code className="px-1 py-0.5 bg-[var(--vie-line)] rounded">admin1234</code>
          </p>
        </div>
      </main>
    </div>
  );
}
