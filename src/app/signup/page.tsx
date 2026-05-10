"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { toast } from "sonner";
import { isValidOib, normaliseOib } from "@/lib/oib";
import { Loader2, ArrowRight, Check, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useT();
  const [step, setStep] = useState<1 | 2>(1);
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

  const oibClean = normaliseOib(form.oib);
  const oibValid = oibClean.length === 11 && isValidOib(oibClean);
  const oibPartiallyValid = form.oib === "" || oibValid;

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    if (!oibValid) {
      toast.error(t("signup.oibInvalid"));
      return;
    }
    if (!form.companyName.trim()) {
      toast.error(t("signup.companyRequired"));
      return;
    }
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, oib: oibClean }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? t("signup.failed"));
        setLoading(false);
        return;
      }
      router.push(json.redirect || "/app");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.networkError"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 max-w-lg w-full mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand size="md" subtitle={t("brand.loyalty")} />
        </Link>
      </header>
      <main className="flex-1 px-6 max-w-lg w-full mx-auto pt-2 pb-10 v-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <span className={`v-pill ${step === 1 ? "v-pill-brand" : "v-pill-muted"}`}>{t("signup.step1")}</span>
          <span className="text-[var(--vie-ink-muted)] text-xs">→</span>
          <span className={`v-pill ${step === 2 ? "v-pill-brand" : "v-pill-muted"}`}>{t("signup.step2")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-3">{step === 1 ? t("signup.step1Title") : t("signup.step2Title")}</h1>
        <p className="text-[var(--vie-ink-soft)] mt-1">
          {step === 1 ? t("signup.step1Sub") : t("signup.step2Sub")}
        </p>

        {step === 1 && (
          <form onSubmit={nextStep} className="mt-6 v-card space-y-4">
            <div>
              <label className="v-label">{t("signup.companyName")}</label>
              <input className="v-input" required placeholder="Instalaterm d.o.o." value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div>
              <label className="v-label">{t("signup.oib")}</label>
              <div className="relative">
                <input
                  className={`v-input ${!oibPartiallyValid ? "v-input-error" : ""} pr-10`}
                  required
                  inputMode="numeric"
                  maxLength={13}
                  placeholder={t("signup.oibHelp.digits")}
                  value={form.oib}
                  onChange={(e) => update("oib", e.target.value)}
                />
                {oibClean.length === 11 && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${oibValid ? "text-[var(--vie-success)]" : "text-[var(--vie-error)]"}`}>
                    {oibValid ? <Check size={18} /> : <X size={18} />}
                  </span>
                )}
              </div>
              {oibClean.length > 0 && oibClean.length < 11 && <div className="v-help">{11 - oibClean.length} {t("signup.oibHelp.more")}</div>}
              {oibClean.length === 11 && !oibValid && <div className="v-help v-help-error">{t("signup.oibHelp.invalid")}</div>}
              {oibValid && <div className="v-help v-help-success">{t("signup.oibHelp.valid")}</div>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="v-label">{t("profile.city")}</label>
                <input className="v-input" placeholder="Zagreb" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div>
                <label className="v-label">{t("profile.postalCode")}</label>
                <input className="v-input" placeholder="10000" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="v-label">{t("signup.address")}</label>
              <input className="v-input" placeholder="Savska cesta 18" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div>
              <label className="v-label">{t("signup.phoneOpt")}</label>
              <input className="v-input" type="tel" placeholder="+385 …" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <button type="submit" disabled={!oibValid || !form.companyName.trim()} className="v-btn v-btn-primary w-full">
              {t("common.continue")} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="mt-6 v-card space-y-4">
            <div>
              <label className="v-label">{t("auth.email")}</label>
              <input className="v-input" type="email" autoComplete="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.hr" />
            </div>
            <div>
              <label className="v-label">{t("signup.passwordHelp")}</label>
              <input className="v-input" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="v-btn v-btn-ghost flex-1">{t("common.back")}</button>
              <button type="submit" disabled={loading} className="v-btn v-btn-primary flex-1">
                {loading ? <Loader2 className="animate-spin" size={16} /> : t("signup.create")}
              </button>
            </div>
            <div className="text-sm text-center text-[var(--vie-ink-soft)] pt-1">
              {t("signup.alreadyHave")} <Link href="/login" className="text-[var(--vie-red)] font-semibold">{t("auth.signIn")}</Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
