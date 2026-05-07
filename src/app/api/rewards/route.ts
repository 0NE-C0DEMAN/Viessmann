import { NextResponse } from "next/server";
import { db } from "@/db";
import { rewards } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(rewards).where(eq(rewards.active, true));
  return NextResponse.json({ rewards: rows });
}
