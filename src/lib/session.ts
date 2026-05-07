import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  installerId?: string;
  email?: string;
  companyName?: string;
  role?: "installer" | "admin";
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "dev-only-secret-please-replace-this-with-a-32-char-string",
  cookieName: "viessmann_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireInstaller() {
  const session = await getSession();
  if (!session.installerId) {
    throw new Error("UNAUTHENTICATED");
  }
  return { installerId: session.installerId, email: session.email!, role: session.role ?? "installer" };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.installerId || session.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return { installerId: session.installerId, email: session.email!, role: "admin" as const };
}
