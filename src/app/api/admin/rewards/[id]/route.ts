import { NextResponse } from "next/server";
import { db } from "@/db";
import { rewards, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  pointCost: z.number().int().min(1).max(1_000_000).optional(),
  inventory: z.number().int().min(0).max(100_000).optional(),
  tierRequired: z.enum(["Bronze", "Silver", "Gold", "Platinum"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  const update: Partial<typeof rewards.$inferInsert> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description ?? null;
  if (data.pointCost !== undefined) update.pointCost = data.pointCost;
  if (data.inventory !== undefined) update.inventory = data.inventory;
  if (data.tierRequired !== undefined) update.tierRequired = data.tierRequired;
  if (data.active !== undefined) update.active = data.active;

  await db.update(rewards).set(update).where(eq(rewards.id, id));
  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: "reward.updated",
    entityType: "reward",
    entityId: id,
    payload: data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  // Soft-delete: just toggle active=false. Hard-deleting could orphan redemptions.
  await db.update(rewards).set({ active: false }).where(eq(rewards.id, id));
  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: "reward.deactivated",
    entityType: "reward",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
