import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { isValidOib, normaliseOib } from "@/lib/oib";
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  oib: z.string(),
  companyName: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid fields", details: parsed.error.issues }, { status: 400 });
  }
  const { email, password, oib, companyName, address, city, postalCode, phone } = parsed.data;
  const oibClean = normaliseOib(oib);

  if (!isValidOib(oibClean)) {
    return NextResponse.json({ error: "Invalid OIB checksum" }, { status: 400 });
  }

  const emailLc = email.toLowerCase();

  const existing = await db.select().from(installers).where(eq(installers.email, emailLc)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const oibTaken = await db.select({ id: installers.id }).from(installers).where(eq(installers.oib, oibClean)).limit(1);
  if (oibTaken.length > 0) {
    return NextResponse.json({ error: "An account with this OIB already exists" }, { status: 409 });
  }

  const inserted = await db.insert(installers).values({
    email: emailLc,
    passwordHash: hashPassword(password),
    role: "installer",
    oib: oibClean,
    companyName,
    address: address || null,
    city: city || null,
    postalCode: postalCode || null,
    phone: phone || null,
    country: "HR",
  }).returning({ id: installers.id });

  await db.insert(auditLog).values({
    actorId: inserted[0].id,
    actorEmail: emailLc,
    action: "installer.signup",
    entityType: "installer",
    entityId: inserted[0].id,
  });

  const session = await getSession();
  session.installerId = inserted[0].id;
  session.email = emailLc;
  session.role = "installer";
  await session.save();

  return NextResponse.json({ ok: true, redirect: "/app" });
}
