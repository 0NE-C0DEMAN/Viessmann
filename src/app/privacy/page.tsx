import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata = { title: "Privacy · Viessmann B2B Loyalty" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-3xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand size="md" subtitle="Loyalty" />
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-3xl w-full mx-auto pb-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="text-sm text-[var(--vie-ink-muted)] mt-1">Prototype · placeholder copy</p>

        <div className="prose prose-sm mt-6 space-y-4 text-[var(--vie-ink)]">
          <p>This prototype is for internal evaluation by Viessmann and our partner installers in Croatia. The production privacy policy will be drafted with Viessmann legal as part of the GDPR DPIA prior to pilot launch.</p>
          <h2 className="text-lg font-bold mt-6">What we collect</h2>
          <ul className="list-disc pl-5 text-sm text-[var(--vie-ink-soft)] space-y-1">
            <li>Account data: email, password hash, OIB, company details, optional phone.</li>
            <li>Submitted invoices: PDF / XML / OCR-extracted text plus parsed structured fields (line items, totals, OIBs of seller and buyer).</li>
            <li>Loyalty ledger: every points accrual, redemption, and admin adjustment, append-only.</li>
            <li>Audit log: actor + action + timestamp for security and accountability.</li>
          </ul>
          <h2 className="text-lg font-bold mt-6">Where it lives</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">EU-region Postgres (Neon, Frankfurt). No data is sent outside the EU.</p>
          <h2 className="text-lg font-bold mt-6">Your rights</h2>
          <p className="text-sm text-[var(--vie-ink-soft)]">
            For data export or erasure requests, email{" "}
            <a className="text-[var(--vie-red)] font-semibold" href="mailto:loyalty@viessmann.hr">loyalty@viessmann.hr</a>.
          </p>
        </div>
      </main>
      <footer className="px-6 py-6 text-xs text-[var(--vie-ink-muted)] max-w-3xl w-full mx-auto border-t border-[var(--vie-line)]">
        <Link href="/" className="hover:text-[var(--vie-ink)]">← Back to home</Link>
      </footer>
    </div>
  );
}
