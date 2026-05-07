"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidOib, normaliseOib } from "@/lib/oib";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    oib: "",
    companyName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oibValid = form.oib === "" || isValidOib(normaliseOib(form.oib));

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!oibValid) {
      setError("OIB checksum is invalid");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          oib: normaliseOib(form.oib),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Signup failed");
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-lg w-full mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--vie-orange)]" />
          <span className="font-bold tracking-tight">Viessmann <span className="text-[var(--vie-orange)]">B2B</span></span>
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-lg w-full mx-auto pt-2 pb-10">
        <h1 className="text-2xl font-bold tracking-tight">Become a member</h1>
        <p className="text-sm text-[var(--vie-ink-soft)] mt-1">Register your business to start earning loyalty points.</p>

        <form onSubmit={submit} className="mt-6 v-card space-y-4">
          <div>
            <label className="v-label">Company name</label>
            <input className="v-input" required placeholder="Instalaterm d.o.o." value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
          </div>
          <div>
            <label className="v-label">OIB (Croatian VAT)</label>
            <input
              className={`v-input ${oibValid ? "" : "!border-[var(--vie-error)]"}`}
              required
              inputMode="numeric"
              placeholder="11 digits"
              value={form.oib}
              onChange={(e) => update("oib", e.target.value)}
            />
            {!oibValid && <div className="text-xs text-[var(--vie-error)] mt-1">Invalid checksum — please double-check.</div>}
            {form.oib && oibValid && form.oib.length >= 11 && <div className="text-xs text-[var(--vie-success)] mt-1">OIB checksum valid ✓</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="v-label">City</label>
              <input className="v-input" placeholder="Zagreb" value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <label className="v-label">Postal code</label>
              <input className="v-input" placeholder="10000" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="v-label">Street address</label>
            <input className="v-input" placeholder="Savska cesta 18" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div>
            <label className="v-label">Phone (optional)</label>
            <input className="v-input" type="tel" placeholder="+385 …" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <hr className="border-[var(--vie-line)]" />
          <div>
            <label className="v-label">Email</label>
            <input className="v-input" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className="v-label">Password (min 6 chars)</label>
            <input className="v-input" type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>
          {error && <div className="text-sm text-[var(--vie-error)]">{error}</div>}
          <button type="submit" disabled={loading} className="v-btn v-btn-primary w-full">{loading ? "Creating account…" : "Create account"}</button>
          <div className="text-sm text-center text-[var(--vie-ink-soft)]">
            Already have an account? <Link href="/login" className="text-[var(--vie-orange)] font-semibold">Sign in</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
