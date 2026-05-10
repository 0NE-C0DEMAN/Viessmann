"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Building2 } from "lucide-react";
import { formatPoints } from "@/lib/money";
import { relativeDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

interface Row {
  oib: string;
  name: string;
  submissions: number;
  approved: number;
  approvedValue: string;
  pointsAwarded: number;
  lastSeen: string;
}

export function WholesalersClient({ rows }: { rows: Row[] }) {
  const { t } = useT();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    if (!norm) return rows;
    return rows.filter((r) => [r.oib, r.name].some((v) => v.toLowerCase().includes(norm)));
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.whole.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">{t("admin.whole.subtitle")}</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
        <input className="v-input pl-10" placeholder={t("admin.whole.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="v-card text-center py-12">
          <Building2 className="mx-auto text-[var(--vie-ink-muted)]" size={32} />
          <div className="font-semibold mt-2">{t("admin.whole.empty.title")}</div>
          <div className="text-xs text-[var(--vie-ink-muted)] mt-1">{t("admin.whole.empty.body")}</div>
        </div>
      ) : (
        <div className="v-card v-scroll-x">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
                <th className="py-2.5 font-semibold">{t("admin.whole.col.name")}</th>
                <th className="font-semibold">{t("admin.installers.col.oib")}</th>
                <th className="font-semibold">{t("admin.whole.col.subs")}</th>
                <th className="font-semibold">{t("admin.whole.col.approved")}</th>
                <th className="font-semibold">{t("admin.whole.col.value")}</th>
                <th className="font-semibold">{t("admin.whole.col.points")}</th>
                <th className="font-semibold">{t("admin.whole.col.lastSeen")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.oib} className="border-b border-[var(--vie-line)] last:border-b-0 hover:bg-[var(--vie-paper)]">
                  <td className="py-2.5 font-medium">{r.name}</td>
                  <td className="py-2.5 text-xs v-numeric">{r.oib}</td>
                  <td className="py-2.5 v-numeric">{r.submissions}</td>
                  <td className="py-2.5 v-numeric">{r.approved}</td>
                  <td className="py-2.5 v-numeric">{r.approvedValue}</td>
                  <td className="py-2.5 v-numeric">{formatPoints(r.pointsAwarded)}</td>
                  <td className="py-2.5 text-xs text-[var(--vie-ink-muted)]">{relativeDate(r.lastSeen)}</td>
                  <td className="py-2.5 text-right">
                    <Link href={`/admin?wholesaler=${encodeURIComponent(r.oib)}`} className="text-[var(--vie-red)] font-semibold text-xs">{t("admin.whole.viewReceipts")}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
