import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, auditLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  productFamily: z.string().optional(),
  bonusMultiplier: z.number().int().min(100).max(1000),
  bonusFlatPerUnit: z.number().int().min(0).max(100000),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  return NextResponse.json({ campaigns: rows });
}

export async function POST(req: Request) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });

  const inserted = await db.insert(campaigns).values({
    name: parsed.data.name,
    description: parsed.data.description || null,
    productFamily: parsed.data.productFamily || null,
    bonusMultiplier: parsed.data.bonusMultiplier,
    bonusFlatPerUnit: parsed.data.bonusFlatPerUnit,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date(),
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    active: parsed.data.active ?? true,
  }).returning({ id: campaigns.id });

  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: "campaign.created",
    entityType: "campaign",
    entityId: inserted[0].id,
    payload: parsed.data,
  });

  return NextResponse.json({ ok: true, id: inserted[0].id });
}
