"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function PasswordForm() {
  const { t } = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (next !== confirm) { toast.error("Passwords don't match."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not change password");
        return;
      }
      toast.success(t("common.saved"));
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="v-card space-y-3">
      <div className="text-sm font-bold flex items-center gap-2"><Lock size={14} /> {t("settings.password.title")}</div>
      <div>
        <label className="v-label">{t("settings.password.current")}</label>
        <input className="v-input" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label className="v-label">{t("settings.password.new")}</label>
        <input className="v-input" type="password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div>
        <label className="v-label">{t("settings.password.new")}</label>
        <input className="v-input" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button type="submit" disabled={busy} className="v-btn v-btn-primary w-full">
        {busy ? <Loader2 className="animate-spin" size={16} /> : t("settings.password.btn")}
      </button>
    </form>
  );
}
