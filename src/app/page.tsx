import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Camera, FileText, ShieldCheck, TrendingUp, Trophy, ArrowRight } from "lucide-react";

export default async function Home() {
  const s = await getSession();
  if (s.installerId) {
    redirect(s.role === "admin" ? "/admin" : "/app");
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="px-6 py-5 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="v-logo">V</span>
          <span className="font-bold tracking-tight text-lg">Viessmann <span className="text-[var(--vie-red)]">Loyalty</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="v-btn v-btn-ghost v-btn-sm">Sign in</Link>
          <Link href="/signup" className="v-btn v-btn-primary v-btn-sm hidden sm:inline-flex">Register</Link>
        </div>
      </header>

      <main className="flex-1 px-6 max-w-6xl w-full mx-auto">
        <section className="pt-10 sm:pt-16 pb-12 grid md:grid-cols-2 gap-10 items-center v-fade-in">
          <div>
            <span className="v-pill v-pill-brand mb-5">Croatia pilot · 2026</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Get rewarded for every Viessmann install.
            </h1>
            <p className="mt-5 text-[var(--vie-ink-soft)] text-lg max-w-md">
              Submit your wholesaler invoice — photo or e-invoice XML — and earn loyalty points instantly. Redeem for tools, training, and exclusive rewards.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="v-btn v-btn-primary">
                Become a member <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="v-btn v-btn-ghost">I already have an account</Link>
            </div>
            <div className="mt-5 flex items-center gap-6 text-xs text-[var(--vie-ink-muted)]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> GDPR · EU hosted</span>
              <span className="flex items-center gap-1.5"><Trophy size={14} /> 4 tier ladder</span>
            </div>
          </div>

          <div className="v-card relative overflow-hidden">
            <div className="text-xs font-semibold text-[var(--vie-ink-muted)] uppercase tracking-wider mb-4">How it works</div>
            <ol className="space-y-4">
              <Step n={1} title="Capture" desc="Snap your wholesaler receipt or upload an e-invoice XML." icon={<Camera size={18} />} />
              <Step n={2} title="Auto-parse" desc="AI reads the Croatian invoice, finds Viessmann lines, validates OIB." icon={<FileText size={18} />} />
              <Step n={3} title="Earn & redeem" desc="Points hit your balance instantly. Browse the rewards catalog." icon={<Trophy size={18} />} />
            </ol>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 pb-12">
          <Feature
            title="OCR + e-Invoice"
            desc="Photos today, XML from 01.01.2026. Both flow through the same pipeline."
            icon={<FileText size={20} />}
          />
          <Feature
            title="OIB-verified"
            desc="Croatian VAT checksum validated on every submission. No double-claims."
            icon={<ShieldCheck size={20} />}
          />
          <Feature
            title="Tier rewards"
            desc="Bronze → Silver → Gold → Platinum. Bigger balances unlock bigger rewards."
            icon={<TrendingUp size={20} />}
          />
        </section>

        <section className="v-card mb-12 bg-[var(--vie-red-light)] border-[var(--vie-red-light)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-red-dark)] mb-2">Demo accounts</div>
          <div className="text-sm text-[var(--vie-ink)]">
            Try it live — sign in as <code className="px-1.5 py-0.5 bg-white rounded text-xs">ivo@instalaterm.hr</code>, <code className="px-1.5 py-0.5 bg-white rounded text-xs">marko@energomont.hr</code>, or <code className="px-1.5 py-0.5 bg-white rounded text-xs">ana@termoprojekt.hr</code> (password <code className="px-1.5 py-0.5 bg-white rounded text-xs">demo1234</code>).
            Admin: <code className="px-1.5 py-0.5 bg-white rounded text-xs">admin@viessmann.com</code> / <code className="px-1.5 py-0.5 bg-white rounded text-xs">admin1234</code>.
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-xs text-[var(--vie-ink-muted)] max-w-6xl w-full mx-auto border-t border-[var(--vie-line)]">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>Viessmann B2B Loyalty · Prototype · {new Date().getFullYear()}</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--vie-ink)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--vie-ink)]">Terms</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, title, desc, icon }: { n: number; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center font-bold text-sm">
        {icon}
      </div>
      <div>
        <div className="font-semibold flex items-center gap-2">
          <span className="text-xs text-[var(--vie-ink-muted)]">Step {n}</span>
          <span>{title}</span>
        </div>
        <div className="text-sm text-[var(--vie-ink-soft)]">{desc}</div>
      </div>
    </li>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="v-card">
      <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="font-bold tracking-tight">{title}</div>
      <p className="text-sm text-[var(--vie-ink-soft)] mt-1">{desc}</p>
    </div>
  );
}
