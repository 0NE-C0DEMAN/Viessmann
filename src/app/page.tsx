import Link from "next/link";
import { Brand } from "@/components/brand";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Camera, FileText, ShieldCheck, TrendingUp, Trophy, ArrowRight } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const s = await getSession();
  if (s.installerId) {
    redirect(s.role === "admin" ? "/admin" : "/app");
  }
  const { t } = await getT();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="px-6 py-5 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Brand size="md" subtitle={t("brand.loyalty")} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="v-btn v-btn-ghost v-btn-sm">{t("landing.signIn")}</Link>
          <Link href="/signup" className="v-btn v-btn-primary v-btn-sm hidden sm:inline-flex">{t("landing.register")}</Link>
        </div>
      </header>

      <main className="flex-1 px-6 max-w-6xl w-full mx-auto">
        <section className="pt-10 sm:pt-16 pb-12 grid md:grid-cols-2 gap-10 items-center v-fade-in">
          <div>
            <span className="v-pill v-pill-brand mb-5">{t("landing.pilotBadge")}</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              {t("landing.headline")}
            </h1>
            <p className="mt-5 text-[var(--vie-ink-soft)] text-lg max-w-md">
              {t("landing.subhead")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="v-btn v-btn-primary">
                {t("landing.becomeMember")} <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="v-btn v-btn-ghost">{t("landing.haveAccount")}</Link>
            </div>
            <div className="mt-5 flex items-center gap-6 text-xs text-[var(--vie-ink-muted)]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {t("landing.gdpr")}</span>
              <span className="flex items-center gap-1.5"><Trophy size={14} /> {t("landing.tierLadder")}</span>
            </div>
          </div>

          <div className="v-card relative overflow-hidden">
            <div className="text-xs font-semibold text-[var(--vie-ink-muted)] uppercase tracking-wider mb-4">{t("landing.howItWorks")}</div>
            <ol className="space-y-4">
              <Step n={1} stepLabel={t("landing.step")} title={t("landing.step1Title")} desc={t("landing.step1Desc")} icon={<Camera size={18} />} />
              <Step n={2} stepLabel={t("landing.step")} title={t("landing.step2Title")} desc={t("landing.step2Desc")} icon={<FileText size={18} />} />
              <Step n={3} stepLabel={t("landing.step")} title={t("landing.step3Title")} desc={t("landing.step3Desc")} icon={<Trophy size={18} />} />
            </ol>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 pb-12">
          <Feature title={t("landing.feat.ocrTitle")} desc={t("landing.feat.ocrDesc")} icon={<FileText size={20} />} />
          <Feature title={t("landing.feat.oibTitle")} desc={t("landing.feat.oibDesc")} icon={<ShieldCheck size={20} />} />
          <Feature title={t("landing.feat.tierTitle")} desc={t("landing.feat.tierDesc")} icon={<TrendingUp size={20} />} />
        </section>

        <section className="v-card mb-12 bg-[var(--vie-red-light)] border-[var(--vie-red-light)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--vie-red-dark)] mb-2">{t("landing.demoTitle")}</div>
          <div className="text-sm text-[var(--vie-ink)]">
            {t("landing.demoBody")}{" "}
            <code className="px-1.5 py-0.5 bg-white rounded text-xs">ivo@instalaterm.hr</code>, <code className="px-1.5 py-0.5 bg-white rounded text-xs">marko@energomont.hr</code>, <code className="px-1.5 py-0.5 bg-white rounded text-xs">ana@termoprojekt.hr</code> ({t("auth.allPasswords")} <code className="px-1.5 py-0.5 bg-white rounded text-xs">demo1234</code>). {t("auth.adminLabel")}: <code className="px-1.5 py-0.5 bg-white rounded text-xs">admin@viessmann.com</code> / <code className="px-1.5 py-0.5 bg-white rounded text-xs">admin1234</code>.
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-xs text-[var(--vie-ink-muted)] max-w-6xl w-full mx-auto border-t border-[var(--vie-line)]">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <span>Viessmann B2B Loyalty · {t("landing.footer")} · {new Date().getFullYear()}</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--vie-ink)]">{t("landing.privacy")}</Link>
            <Link href="/terms" className="hover:text-[var(--vie-ink)]">{t("landing.terms")}</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, stepLabel, title, desc, icon }: { n: number; stepLabel: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--vie-red-light)] text-[var(--vie-red-dark)] flex items-center justify-center font-bold text-sm">
        {icon}
      </div>
      <div>
        <div className="font-semibold flex items-center gap-2">
          <span className="text-xs text-[var(--vie-ink-muted)]">{stepLabel} {n}</span>
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
