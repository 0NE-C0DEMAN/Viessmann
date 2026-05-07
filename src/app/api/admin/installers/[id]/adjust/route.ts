import { NextResponse } from "next/server";
import { db } from "@/db";
import { pointsLedger, auditLog } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  delta: z.number().int(),
  reason: z.string().min(2),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await db.insert(pointsLedger).values({
    installerId: id,
    delta: parsed.data.delta,
    reason: "adjustment",
    actorId: admin.installerId,
    note: parsed.data.reason,
  });
  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: "points.adjust",
    entityType: "installer",
    entityId: id,
    payload: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
