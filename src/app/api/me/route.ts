import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireInstaller } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  companyName: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
});

export async function PATCH(req: Request) {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await db.update(installers).set({
    companyName: parsed.data.companyName,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    postalCode: parsed.data.postalCode || null,
    phone: parsed.data.phone || null,
  }).where(eq(installers.id, user.installerId));

  await db.insert(auditLog).values({
    actorId: user.installerId,
    actorEmail: user.email,
    action: "profile.updated",
    entityType: "installer",
    entityId: user.installerId,
    payload: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
