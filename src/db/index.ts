import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("POSTGRES_URL or DATABASE_URL must be set");
  }
  const client = postgres(url, { max: 1, prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

// Proxy so consumers can `import { db } from "@/db"` without triggering the
// connection at import time. Each access goes through getDb().
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_t, prop, receiver) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const v = target[prop as string];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
  },
});

export { schema };
