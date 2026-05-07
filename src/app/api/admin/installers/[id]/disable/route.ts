import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  disabled: z.boolean(),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await db.update(installers).set({
    disabled: parsed.data.disabled,
    disabledReason: parsed.data.disabled ? (parsed.data.reason ?? null) : null,
  }).where(eq(installers.id, id));

  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: parsed.data.disabled ? "installer.disabled" : "installer.enabled",
    entityType: "installer",
    entityId: id,
    payload: { reason: parsed.data.reason ?? null },
  });

  return NextResponse.json({ ok: true });
}
