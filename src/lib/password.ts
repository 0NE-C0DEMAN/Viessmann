// Lightweight password hashing using Node's built-in scrypt.
// Avoids native bcrypt deps that don't always build on Vercel.

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;
const N = 16384;
const r = 8;
const p = 1;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(plain, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N_, r_, p_, salt, hexHash] = parts;
  const derived = scryptSync(plain, salt, KEYLEN, { N: Number(N_), r: Number(r_), p: Number(p_) });
  const stored_buf = Buffer.from(hexHash, "hex");
  if (stored_buf.length !== derived.length) return false;
  return timingSafeEqual(stored_buf, derived);
}
