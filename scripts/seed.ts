import "dotenv/config";
import { db } from "../src/db";
import { installers, wholesalers, products, rewards } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";
import { SEED_INSTALLERS, SEED_WHOLESALERS, SEED_PRODUCTS, SEED_REWARDS } from "../src/lib/seed-data";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  // Clear existing seed rows (idempotent for demo).
  await db.execute(sql`TRUNCATE TABLE points_ledger, redemptions, receipt_line_items, receipts, audit_log RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE rewards, products, wholesalers, installers RESTART IDENTITY CASCADE`);

  // Wholesalers
  for (const w of SEED_WHOLESALERS) {
    await db.insert(wholesalers).values(w).onConflictDoNothing();
  }
  console.log(`  ${SEED_WHOLESALERS.length} wholesalers`);

  // Products
  for (const p of SEED_PRODUCTS) {
    await db.insert(products).values({ ...p, isViessmann: true }).onConflictDoNothing();
  }
  console.log(`  ${SEED_PRODUCTS.length} products`);

  // Installers
  for (const i of SEED_INSTALLERS) {
    await db.insert(installers).values({
      email: i.email,
      passwordHash: hashPassword(i.password),
      role: i.role,
      oib: i.oib,
      companyName: i.companyName,
      address: i.address,
      city: i.city,
      postalCode: i.postalCode,
      country: "HR",
    }).onConflictDoNothing();
  }
  console.log(`  ${SEED_INSTALLERS.length} installers (incl. admin)`);

  // Rewards
  for (const r of SEED_REWARDS) {
    await db.insert(rewards).values(r).onConflictDoNothing();
  }
  console.log(`  ${SEED_REWARDS.length} rewards`);

  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
