import { NextResponse } from "next/server";
import { db } from "@/db";
import { installers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const found = await db.select().from(installers).where(eq(installers.email, email.toLowerCase())).limit(1);
  if (found.length === 0 || !verifyPassword(password, found[0].passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const u = found[0];

  if (u.disabled) {
    return NextResponse.json(
      {
        error: u.disabledReason
          ? `This account has been disabled: ${u.disabledReason}. Contact loyalty@viessmann.hr.`
          : "This account has been disabled. Contact loyalty@viessmann.hr.",
      },
      { status: 403 },
    );
  }

  const session = await getSession();
  session.installerId = u.id;
  session.email = u.email;
  session.companyName = u.companyName;
  session.role = (u.role === "admin" ? "admin" : "installer");
  await session.save();

  return NextResponse.json({
    ok: true,
    role: session.role,
    redirect: session.role === "admin" ? "/admin" : "/app",
  });
}
