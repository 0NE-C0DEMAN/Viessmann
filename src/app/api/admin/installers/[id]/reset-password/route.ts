import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { z } from "zod";
import { randomBytes } from "crypto";

const Body = z.object({
  newPassword: z.string().min(6).max(100).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // If the admin didn't supply a password, generate a friendly random one
  // and return it so they can pass it to the installer out of band.
  const newPassword = parsed.data.newPassword ?? generateTempPassword();

  await db.update(installers).set({
    passwordHash: hashPassword(newPassword),
  }).where(eq(installers.id, id));

  await db.insert(auditLog).values({
    actorId: admin.installerId,
    actorEmail: admin.email,
    action: "installer.password_reset",
    entityType: "installer",
    entityId: id,
    payload: { generated: !parsed.data.newPassword },
  });

  return NextResponse.json({
    ok: true,
    newPassword,
    note: "Share this password with the installer over a secure channel. They should change it after signing in.",
  });
}

function generateTempPassword(): string {
  // 12 chars, letters + digits, easy to read.
  const bytes = randomBytes(9);
  return bytes.toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}
