import { NextResponse } from "next/server";
import { db } from "@/db";
import { redemptions, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  status: z.enum(["requested", "shipped", "cancelled"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await db.update(redemptions).set({ status: parsed.data.status }).where(eq(redemptions.id, id));
  await db.insert(auditLog).values({ actorId: admin.installerId, actorEmail: admin.email, action: `redemption.${parsed.data.status}`, entityType: "redemption", entityId: id });
  return NextResponse.json({ ok: true });
}
