import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AuditClient } from "./audit-client";

export default async function AdminAuditPage() {
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(1000);
  // Serialize for the client component (Date -> ISO string).
  const serialized = rows.map((r) => ({
    id: r.id,
    actorEmail: r.actorEmail,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    payload: r.payload as unknown,
    createdAt: r.createdAt!.toISOString(),
  }));
  return <AuditClient rows={serialized} />;
}
