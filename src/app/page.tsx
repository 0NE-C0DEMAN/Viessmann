import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const s = await getSession();
  if (s.installerId) {
    redirect(s.role === "admin" ? "/admin" : "/app");
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[var(--vie-paper)]">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--vie-orange)]" />
          <span className="font-bold tracking-tight">Viessmann <span className="text-[var(--vie-orange)]">B2B</span></span>
        </div>
        <Link href="/login" className="v-btn v-btn-ghost text-sm">Sign in</Link>
      </header>

      <main className="flex-1 px-6 max-w-5xl w-full mx-auto">
        <section className="pt-10 pb-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="v-pill v-pill-processing mb-4">Loyalty programme · pilot</span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Scan an invoice.<br />
              <span className="text-[var(--vie-orange)]">Earn points.</span>
            </h1>
            <p className="mt-4 text-[var(--vie-ink-soft)] text-lg max-w-md">
              The B2B loyalty programme for Viessmann installers in Croatia. Submit your wholesaler invoice — we read it, match the products, and credit your account.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/signup" className="v-btn v-btn-primary">Become a member</Link>
              <Link href="/login" className="v-btn v-btn-ghost">I already have an account</Link>
            </div>
            <p className="mt-3 text-xs text-[var(--vie-ink-soft)]">Demo: any installer in <code>Instalaterm</code>, <code>Energo-Mont</code>, <code>Termo-Projekt</code> can sign in with password <code>demo1234</code>.</p>
          </div>
          <div className="v-card relative overflow-hidden">
            <div className="text-xs text-[var(--vie-ink-soft)] mb-3">How it works</div>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[var(--vie-orange)] text-white flex items-center justify-center font-bold text-xs">1</span> Take a photo of your wholesaler receipt or upload an e-invoice XML.</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[var(--vie-orange)] text-white flex items-center justify-center font-bold text-xs">2</span> The app reads it, finds Viessmann products, calculates points.</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[var(--vie-orange)] text-white flex items-center justify-center font-bold text-xs">3</span> Points hit your balance. Redeem for tools, training, and rewards.</li>
            </ol>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 pb-12">
          <div className="v-card">
            <div className="text-2xl font-bold">OCR + e-Invoice</div>
            <p className="text-sm text-[var(--vie-ink-soft)] mt-1">Photos today, XML from 01.01.2026 — both flow into the same pipeline.</p>
          </div>
          <div className="v-card">
            <div className="text-2xl font-bold">OIB-verified</div>
            <p className="text-sm text-[var(--vie-ink-soft)] mt-1">We validate the buyer&apos;s OIB checksum and match it to your account.</p>
          </div>
          <div className="v-card">
            <div className="text-2xl font-bold">Tier rewards</div>
            <p className="text-sm text-[var(--vie-ink-soft)] mt-1">Bronze → Silver → Gold → Platinum. More points, better catalog.</p>
          </div>
        </section>
      </main>

      <footer className="px-6 py-6 text-xs text-[var(--vie-ink-soft)] max-w-5xl w-full mx-auto">
        Viessmann B2B Loyalty · Prototype · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
