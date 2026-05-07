import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireInstaller } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { z } from "zod";

const Body = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireInstaller();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const me = (await db.select().from(installers).where(eq(installers.id, user.installerId)).limit(1))[0];
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!verifyPassword(parsed.data.currentPassword, me.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await db.update(installers).set({ passwordHash: hashPassword(parsed.data.newPassword) }).where(eq(installers.id, user.installerId));
  await db.insert(auditLog).values({
    actorId: user.installerId,
    actorEmail: user.email,
    action: "password.changed",
    entityType: "installer",
    entityId: user.installerId,
  });

  return NextResponse.json({ ok: true });
}
