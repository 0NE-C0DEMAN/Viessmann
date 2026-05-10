"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useT } from "@/lib/i18n/client";

interface InstallerForm {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

export function ProfileForm({ installer }: { installer: InstallerForm }) {
  const router = useRouter();
  const { t } = useT();
  const [form, setForm] = useState(installer);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof InstallerForm>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Save failed");
        return;
      }
      toast.success(t("common.saved"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="v-card space-y-3">
      <div className="text-sm font-bold mb-1">{t("profile.editProfile")}</div>
      <div>
        <label className="v-label">{t("profile.companyName")}</label>
        <input className="v-input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
      </div>
      <div>
        <label className="v-label">{t("profile.address")}</label>
        <input className="v-input" value={form.address} onChange={(e) => update("address", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="v-label">{t("profile.city")}</label>
          <input className="v-input" value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div>
          <label className="v-label">{t("profile.postalCode")}</label>
          <input className="v-input" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="v-label">{t("profile.phone")}</label>
        <input className="v-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="v-btn v-btn-primary w-full">
        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {t("common.save")}</>}
      </button>
    </form>
  );
}
