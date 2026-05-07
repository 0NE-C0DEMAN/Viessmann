import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const s = await getSession();
  if (!s.installerId) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: s.installerId, email: s.email, role: s.role ?? "installer" },
  });
}
