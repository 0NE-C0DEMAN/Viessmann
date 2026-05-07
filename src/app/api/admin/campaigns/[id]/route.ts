import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  await db.update(campaigns).set({
    name: json.name,
    description: json.description ?? null,
    productFamily: json.productFamily ?? null,
    bonusMultiplier: json.bonusMultiplier,
    bonusFlatPerUnit: json.bonusFlatPerUnit,
    active: json.active,
    endsAt: json.endsAt ? new Date(json.endsAt) : null,
  }).where(eq(campaigns.id, id));
  await db.insert(auditLog).values({ actorId: admin.installerId, actorEmail: admin.email, action: "campaign.updated", entityType: "campaign", entityId: id, payload: json });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  await db.delete(campaigns).where(eq(campaigns.id, id));
  await db.insert(auditLog).values({ actorId: admin.installerId, actorEmail: admin.email, action: "campaign.deleted", entityType: "campaign", entityId: id });
  return NextResponse.json({ ok: true });
}
