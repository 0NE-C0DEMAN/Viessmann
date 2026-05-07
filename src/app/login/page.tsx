"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push(json.redirect || "/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  function quick(email: string, pwd = "demo1234") {
    setEmail(email);
    setPassword(pwd);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--vie-orange)]" />
          <span className="font-bold tracking-tight">Viessmann <span className="text-[var(--vie-orange)]">B2B</span></span>
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-md w-full mx-auto pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">Welcome back. Enter your credentials.</p>

        <form onSubmit={submit} className="mt-6 v-card space-y-4">
          <div>
            <label className="v-label">Email</label>
            <input className="v-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="v-label">Password</label>
            <input className="v-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-sm text-[var(--vie-error)]">{error}</div>}
          <button type="submit" disabled={loading} className="v-btn v-btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
          <div className="text-sm text-center text-[var(--vie-ink-soft)]">
            Don&apos;t have an account? <Link href="/signup" className="text-[var(--vie-orange)] font-semibold">Register</Link>
          </div>
        </form>

        <div className="mt-6 v-card">
          <div className="text-xs font-semibold text-[var(--vie-ink-soft)] mb-2">Demo accounts</div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <button onClick={() => quick("ivo@instalaterm.hr")} className="text-left px-3 py-2 rounded-lg border border-[var(--vie-line)] hover:bg-zinc-50">
              <div className="font-semibold">Instalaterm d.o.o.</div>
              <div className="text-xs text-[var(--vie-ink-soft)]">ivo@instalaterm.hr · OIB 98765432109</div>
            </button>
            <button onClick={() => quick("marko@energomont.hr")} className="text-left px-3 py-2 rounded-lg border border-[var(--vie-line)] hover:bg-zinc-50">
              <div className="font-semibold">Energo-Mont d.o.o.</div>
              <div className="text-xs text-[var(--vie-ink-soft)]">marko@energomont.hr · OIB 11223344556</div>
            </button>
            <button onClick={() => quick("ana@termoprojekt.hr")} className="text-left px-3 py-2 rounded-lg border border-[var(--vie-line)] hover:bg-zinc-50">
              <div className="font-semibold">Termo-Projekt d.o.o.</div>
              <div className="text-xs text-[var(--vie-ink-soft)]">ana@termoprojekt.hr · OIB 12345678901</div>
            </button>
            <button onClick={() => quick("admin@viessmann.com", "admin1234")} className="text-left px-3 py-2 rounded-lg border border-[var(--vie-line)] hover:bg-zinc-50">
              <div className="font-semibold">Viessmann admin</div>
              <div className="text-xs text-[var(--vie-ink-soft)]">admin@viessmann.com · password admin1234</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
