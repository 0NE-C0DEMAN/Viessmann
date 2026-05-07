import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { relativeDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(500);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-sm text-[var(--vie-ink-soft)]">Last 500 actions, newest first.</p>
      </div>

      <div className="v-card v-scroll-x">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-left text-xs text-[var(--vie-ink-muted)] uppercase tracking-wider border-b border-[var(--vie-line)]">
              <th className="py-2.5 font-semibold">When</th>
              <th className="font-semibold">Actor</th>
              <th className="font-semibold">Action</th>
              <th className="font-semibold">Entity</th>
              <th className="font-semibold">Payload</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--vie-line)] last:border-b-0 align-top">
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
        {rows.length === 0 && <div className="text-center text-sm text-[var(--vie-ink-muted)] py-12">No audit entries yet.</div>}
      </div>
    </div>
  );
}
