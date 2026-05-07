import Link from "next/link";

export const metadata = { title: "Terms · Viessmann B2B Loyalty" };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-3xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="v-logo">V+</span>
          <span className="font-bold tracking-tight text-lg">Viessmann <span className="text-[var(--vie-orange)]">Loyalty</span></span>
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-3xl w-full mx-auto pb-12">
        <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">Prototype · placeholder copy</p>

        <div className="prose prose-sm mt-6 space-y-4 text-[var(--vie-ink)]">
          <p>This prototype is for internal evaluation. Final terms will be issued by Viessmann legal prior to pilot launch.</p>
          <h2 className="text-lg font-bold mt-6">Eligibility</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">Croatian installer companies with a valid OIB.</p>
          <h2 className="text-lg font-bold mt-6">Earning points</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">Points are awarded for verified Viessmann purchases on submitted invoices, subject to the campaign rules in effect at the time of submission.</p>
          <h2 className="text-lg font-bold mt-6">Redemptions</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">Rewards are subject to availability. Cancelled redemptions refund their points.</p>
          <h2 className="text-lg font-bold mt-6">Anti-fraud</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">Submissions failing OIB validation, dated more than 90 days in the past, or matching another installer's earlier submission are flagged for manual review or rejection.</p>
        </div>
      </main>
      <footer className="px-6 py-6 text-xs text-[var(--vie-ink-muted)] max-w-3xl w-full mx-auto border-t border-[var(--vie-line)]">
        <Link href="/" className="hover:text-[var(--vie-ink)]">← Back to home</Link>
      </footer>
    </div>
  );
}
