"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { relativeDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

interface Row {
  id: string;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  createdAt: string;
}

export function AuditClient({ rows }: { rows: Row[] }) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);
  const entities = useMemo(() => Array.from(new Set(rows.map((r) => r.entityType ?? "—"))).sort(), [rows]);

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "all" && r.action !== action) return false;
      if (entity !== "all" && (r.entityType ?? "—") !== entity) return false;
      if (!norm) return true;
      return [r.actorEmail, r.action, r.entityType, r.entityId, JSON.stringify(r.payload ?? "")].some((v) =>
        (v ?? "").toString().toLowerCase().includes(norm),
      );
    });
  }, [rows, q, action, entity]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.audit.title")}</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">
          {t("admin.audit.subtitle")} {filtered.length} {t("history.of")} {rows.length} {t("admin.audit.shown")}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vie-ink-muted)]" />
          <input
            className="v-input pl-10"
            placeholder={t("admin.audit.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="v-select max-w-[200px]" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">{t("admin.audit.allActions")}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="v-select max-w-[180px]" value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="all">{t("admin.audit.allEntities")}</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="v-card v-scroll-x">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
              <th className="py-2.5 font-semibold">{t("admin.audit.col.when")}</th>
              <th className="font-semibold">{t("admin.audit.col.actor")}</th>
              <th className="font-semibold">{t("admin.audit.col.action")}</th>
              <th className="font-semibold">{t("admin.audit.col.entity")}</th>
              <th className="font-semibold">{t("admin.audit.col.payload")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0 align-top hover:bg-[var(--vie-paper)]">
                <td className="py-2.5 text-xs text-[var(--vie-ink-muted)] whitespace-nowrap">{relativeDate(r.createdAt)}</td>
                <td className="py-2.5 text-xs">{r.actorEmail ?? "—"}</td>
                <td className="py-2.5 font-medium font-mono text-xs">{r.action}</td>
                <td className="py-2.5 text-xs">
                  <span className="text-[var(--vie-ink-muted)]">{r.entityType ?? "—"}</span>
                  {r.entityId && (
                    <div className="text-[10px] font-mono text-[var(--vie-ink-muted)]">{r.entityId.slice(0, 8)}…</div>
                  )}
                </td>
                <td className="py-2.5 text-[11px] font-mono text-[var(--vie-ink-soft)] max-w-[420px]">
                  <div className="truncate" title={r.payload ? JSON.stringify(r.payload) : ""}>
                    {r.payload ? JSON.stringify(r.payload) : "—"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-muted)] py-12">{t("admin.audit.empty")}</div>}
      </div>
    </div>
  );
}
