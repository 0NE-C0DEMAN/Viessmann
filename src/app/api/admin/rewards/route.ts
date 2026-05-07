import { NextResponse } from "next/server";
import { db } from "@/db";
import { rewards, auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  pointCost: z.number().int().min(1).max(1_000_000),
  inventory: z.number().int().min(0).max(100_000),
  tierRequired: z.enum(["Bronze", "Silver", "Gold", "Platinum"]),
  active: z.boolean().optional(),
});

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const rows = await db.select().from(rewards).orderBy(desc(rewards.pointCost));
  return NextResponse.json({ rewards: rows });
}

export async function POST(req: Request) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });

  const inserted = await db.insert(rewards).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    pointCost: parsed.data.pointCost,
    inventory: parsed.data.inventory,
    tierRequired: parsed.data.tierRequired,
    active: parsed.data.active ?? true,
  }).returning({ id: rewards.id });

  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: "reward.created",
    entityType: "reward",
    entityId: inserted[0].id,
    payload: parsed.data,
  });

  return NextResponse.json({ ok: true, id: inserted[0].id });
}
