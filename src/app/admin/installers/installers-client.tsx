"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Plus, Minus, Download } from "lucide-react";
import { formatPoints } from "@/lib/money";
import { useT } from "@/lib/i18n/client";

interface Installer {
  id: string;
  email: string;
  company_name: string;
  oib: string;
  city: string | null;
  tier: string;
  balance: number;
  submissions: number;
  approved: number;
  created_at: string;
}

export function InstallersClient({ installers }: { installers: Installer[] }) {
  const router = useRouter();
  const { t } = useT();
  const [q, setQ] = useState("");
  const [adjusting, setAdjusting] = useState<Installer | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    if (!norm) return installers;
    return installers.filter((i) => [i.company_name, i.email, i.oib, i.city ?? ""].some((v) => v.toLowerCase().includes(norm)));
  }, [installers, q]);

  async function adjust() {
    if (!adjusting) return;
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) { toast.error(t("admin.adj.error.zero")); return; }
    if (!reason.trim()) { toast.error(t("admin.adj.error.reason")); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/installers/${adjusting.id}/adjust`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delta: Math.round(n), reason }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error ?? t("admin.adj.failed"));
        return;
      }
      toast.success(t("admin.adj.success", { delta: `${n > 0 ? "+" : ""}${n}`, company: adjusting.company_name }));
      setAdjusting(null);
      setDelta("");
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.installers.title")}</h1>
          <p className="text-sm text-[var(--vie-ink-soft)]">
            {t("admin.installers.subtitle")} <em>{t("admin.installers.adjustBtn")}</em> {t("admin.installers.subtitle2")} <em>{t("admin.installers.openBtn")}</em> {t("admin.installers.subtitle3")}
          </p>
        </div>
        <a href="/api/admin/export/installers" download className="v-btn v-btn-ghost v-btn-sm">
          <Download size={14} /> {t("admin.queue.export")}
        </a>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
        <input className="v-input pl-10" placeholder={t("admin.installers.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="v-card v-scroll-x">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
              <th className="py-2.5 font-semibold">{t("admin.installers.col.company")}</th>
              <th className="font-semibold">{t("admin.installers.col.oib")}</th>
              <th className="font-semibold">{t("admin.installers.col.city")}</th>
              <th className="font-semibold">{t("admin.installers.col.tier")}</th>
              <th className="font-semibold">{t("admin.installers.col.subs")}</th>
              <th className="font-semibold">{t("admin.installers.col.approved")}</th>
              <th className="font-semibold">{t("admin.installers.col.balance")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const tierKey = r.tier ? r.tier.charAt(0).toUpperCase() + r.tier.slice(1).toLowerCase() : "Bronze";
              return (
                <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0 hover:bg-[var(--vie-paper)]">
                  <td className="py-2.5">
                    <div className="font-medium">{r.company_name}</div>
                    <div className="text-xs text-[var(--vie-ink-muted)]">{r.email}</div>
                  </td>
                  <td className="py-2.5 text-xs v-numeric">{r.oib}</td>
                  <td className="py-2.5 text-xs">{r.city ?? "—"}</td>
                  <td className="py-2.5"><span className="v-pill v-pill-muted">{t(`tier.${tierKey}`)}</span></td>
                  <td className="py-2.5 v-numeric">{r.submissions}</td>
                  <td className="py-2.5 v-numeric">{r.approved}</td>
                  <td className="py-2.5 font-semibold v-numeric">{formatPoints(r.balance)}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => setAdjusting(r)} className="text-[var(--vie-ink-soft)] font-semibold text-xs hover:text-[var(--vie-ink)]">{t("admin.installers.adjustBtn")}</button>
                    <span className="mx-2 text-[var(--vie-line-strong)]">·</span>
                    <Link href={`/admin/installers/${r.id}`} className="text-[var(--vie-red)] font-semibold text-xs">{t("admin.queue.open")}</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-muted)] py-12">{t("admin.installers.empty")}</div>}
      </div>

      {adjusting && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4 v-fade-in" onClick={() => !busy && setAdjusting(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold">{t("admin.adj.title")}</div>
            <div className="text-xs text-[var(--vie-ink-muted)]">{t("admin.adj.subtitle", { company: adjusting.company_name, balance: formatPoints(adjusting.balance) })}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => setDelta("100")} className="v-btn v-btn-soft v-btn-sm"><Plus size={12} /> 100</button>
              <button onClick={() => setDelta("-100")} className="v-btn v-btn-soft v-btn-sm"><Minus size={12} /> 100</button>
            </div>
            <div className="mt-3">
              <label className="v-label">{t("admin.adj.delta")}</label>
              <input className="v-input" type="number" placeholder={t("admin.adj.deltaPlaceholder")} value={delta} onChange={(e) => setDelta(e.target.value)} />
            </div>
            <div className="mt-3">
              <label className="v-label">{t("admin.adj.reason")}</label>
              <textarea className="v-textarea min-h-[60px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.adj.reasonPlaceholder")} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAdjusting(null)} disabled={busy} className="v-btn v-btn-ghost flex-1">{t("admin.adj.cancel")}</button>
              <button onClick={adjust} disabled={busy} className="v-btn v-btn-primary flex-1">{busy ? "…" : t("admin.adj.apply")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
