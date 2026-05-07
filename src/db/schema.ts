import { pgTable, text, timestamp, integer, bigint, boolean, jsonb, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const installers = pgTable("installers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("installer"),
  oib: text("oib").notNull(),
  companyName: text("company_name").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").notNull().default("HR"),
  phone: text("phone"),
  tier: text("tier").notNull().default("bronze"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("installers_oib_idx").on(t.oib),
]);

export const wholesalers = pgTable("wholesalers", {
  id: uuid("id").primaryKey().defaultRandom(),
  oib: text("oib").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  iban: text("iban"),
  trusted: boolean("trusted").notNull().default(true),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  family: text("family").notNull(),
  model: text("model").notNull(),
  description: text("description").notNull(),
  kpdSifra: text("kpd_sifra"),
  pointsPerUnit: integer("points_per_unit").notNull().default(0),
  isViessmann: boolean("is_viessmann").notNull().default(true),
}, (t) => [
  index("products_family_idx").on(t.family),
]);

export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  installerId: uuid("installer_id").notNull().references(() => installers.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // "ocr" | "xml"
  status: text("status").notNull().default("processing"), // processing | needs_review | approved | rejected | duplicate
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  imagePhash: text("image_phash"),
  rawText: text("raw_text"),
  parsedJson: jsonb("parsed_json"),
  // Parsed fields
  wholesalerOib: text("wholesaler_oib"),
  wholesalerName: text("wholesaler_name"),
  buyerOib: text("buyer_oib"),
  buyerName: text("buyer_name"),
  invoiceNumber: text("invoice_number"),
  issueDate: timestamp("issue_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  currency: text("currency").notNull().default("EUR"),
  subtotalCents: bigint("subtotal_cents", { mode: "number" }),
  vatCents: bigint("vat_cents", { mode: "number" }),
  totalCents: bigint("total_cents", { mode: "number" }),
  // Computed
  pointsAwarded: integer("points_awarded").notNull().default(0),
  fraudFlags: jsonb("fraud_flags").$type<string[]>().default(sql`'[]'::jsonb`),
  reviewerNote: text("reviewer_note"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("receipts_installer_idx").on(t.installerId),
  index("receipts_status_idx").on(t.status),
  // Non-unique tuple index — speeds up the pre-flight duplicate lookup in the
  // pipeline. We don't enforce uniqueness at the DB level any more so that
  // duplicate submissions can be persisted (with status='duplicate') alongside
  // the original.
  index("receipts_tuple_idx").on(t.wholesalerOib, t.invoiceNumber, t.buyerOib, t.totalCents),
]);

export const receiptLineItems = pgTable("receipt_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  rawDescription: text("raw_description").notNull(),
  kpdSifra: text("kpd_sifra"),
  unit: text("unit"),
  quantity: text("quantity").notNull(), // numeric stored as text to keep precision
  vatRate: text("vat_rate"),
  unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  matchedProductId: uuid("matched_product_id").references(() => products.id),
  matchConfidence: integer("match_confidence"), // 0..100
  matchKind: text("match_kind"), // exact | normalized | fuzzy | family | none
  isViessmann: boolean("is_viessmann").notNull().default(false),
  pointsBase: integer("points_base").notNull().default(0),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  campaignId: uuid("campaign_id"),
  campaignName: text("campaign_name"),
}, (t) => [
  index("rli_receipt_idx").on(t.receiptId),
]);

// Append-only points ledger. Balance = SUM(delta) for installer.
export const pointsLedger = pgTable("points_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  installerId: uuid("installer_id").notNull().references(() => installers.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(), // accrual | redemption | adjustment | reversal
  receiptId: uuid("receipt_id").references(() => receipts.id),
  redemptionId: uuid("redemption_id"),
  reversedBy: uuid("reversed_by"),
  note: text("note"),
  actorId: uuid("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("ledger_installer_idx").on(t.installerId),
]);

export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  pointCost: integer("point_cost").notNull(),
  inventory: integer("inventory").notNull().default(0),
  imageUrl: text("image_url"),
  // Lowest tier that can redeem this reward. "Bronze" = open to everyone.
  tierRequired: text("tier_required").notNull().default("Bronze"),
  active: boolean("active").notNull().default(true),
});

// Campaigns also gain a per-installer cap so an unusually-large submission
// can't drain the bonus budget for a single user.


export const redemptions = pgTable("redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  installerId: uuid("installer_id").notNull().references(() => installers.id, { onDelete: "cascade" }),
  rewardId: uuid("reward_id").notNull().references(() => rewards.id),
  pointCost: integer("point_cost").notNull(),
  status: text("status").notNull().default("requested"), // requested | shipped | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("redemptions_installer_idx").on(t.installerId),
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  productFamily: text("product_family"),
  bonusMultiplier: integer("bonus_multiplier").notNull().default(100), // percent: 200 = 2x
  bonusFlatPerUnit: integer("bonus_flat_per_unit").notNull().default(0),
  // Per-installer cap on the bonus this campaign can hand out (in points).
  // 0 = unlimited.
  capPerInstaller: integer("cap_per_installer").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Installer = typeof installers.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type ReceiptLineItem = typeof receiptLineItems.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
