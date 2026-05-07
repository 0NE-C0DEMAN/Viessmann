import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export const metadata = { title: "Forgot password · Viessmann B2B Loyalty" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="v-logo">V</span>
          <span className="font-bold tracking-tight text-lg">Viessmann <span className="text-[var(--vie-red)]">Loyalty</span></span>
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-md w-full mx-auto pt-2 v-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Forgot password</h1>
        <p className="text-[var(--vie-ink-soft)] mt-1">We&apos;ll send you a temporary password to get back in.</p>

        <div className="v-card mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center flex-shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <div className="font-semibold text-sm">Email Viessmann support</div>
              <div className="text-xs text-[var(--vie-ink-soft)] mt-1">
                Send a message from your registered email address to{" "}
                <a href="mailto:loyalty@viessmann.hr" className="text-[var(--vie-red)] font-semibold">loyalty@viessmann.hr</a>{" "}
                including your company OIB. Our team verifies the request and issues a temporary password within one business day.
              </div>
            </div>
          </div>
        </div>

        <div className="v-card mt-3 text-xs text-[var(--vie-ink-muted)]">
          <strong className="text-[var(--vie-ink)]">Why no automatic email link?</strong><br />
          The pilot ships without an SMTP integration. Production rolls in self-service password reset over email.
        </div>

        <Link href="/login" className="v-btn v-btn-ghost w-full mt-4">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </main>
    </div>
  );
}
