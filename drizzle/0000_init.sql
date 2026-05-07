CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'installer' NOT NULL,
	"oib" text NOT NULL,
	"company_name" text NOT NULL,
	"address" text,
	"city" text,
	"postal_code" text,
	"country" text DEFAULT 'HR' NOT NULL,
	"phone" text,
	"tier" text DEFAULT 'bronze' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installer_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"receipt_id" uuid,
	"redemption_id" uuid,
	"reversed_by" uuid,
	"note" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family" text NOT NULL,
	"model" text NOT NULL,
	"description" text NOT NULL,
	"kpd_sifra" text,
	"points_per_unit" integer DEFAULT 0 NOT NULL,
	"is_viessmann" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"raw_description" text NOT NULL,
	"kpd_sifra" text,
	"unit" text,
	"quantity" text NOT NULL,
	"vat_rate" text,
	"unit_price_cents" bigint NOT NULL,
	"amount_cents" bigint NOT NULL,
	"matched_product_id" uuid,
	"match_confidence" integer,
	"match_kind" text,
	"is_viessmann" boolean DEFAULT false NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installer_id" uuid NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"file_url" text,
	"file_name" text,
	"image_phash" text,
	"raw_text" text,
	"parsed_json" jsonb,
	"wholesaler_oib" text,
	"wholesaler_name" text,
	"buyer_oib" text,
	"buyer_name" text,
	"invoice_number" text,
	"issue_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"subtotal_cents" bigint,
	"vat_cents" bigint,
	"total_cents" bigint,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"fraud_flags" jsonb DEFAULT '[]'::jsonb,
	"reviewer_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installer_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"point_cost" integer NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"point_cost" integer NOT NULL,
	"inventory" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesalers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"oib" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"iban" text,
	"trusted" boolean DEFAULT true NOT NULL,
	CONSTRAINT "wholesalers_oib_unique" UNIQUE("oib")
);
--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_matched_product_id_products_id_fk" FOREIGN KEY ("matched_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "installers_oib_idx" ON "installers" USING btree ("oib");--> statement-breakpoint
CREATE INDEX "ledger_installer_idx" ON "points_ledger" USING btree ("installer_id");--> statement-breakpoint
CREATE INDEX "products_family_idx" ON "products" USING btree ("family");--> statement-breakpoint
CREATE INDEX "rli_receipt_idx" ON "receipt_line_items" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "receipts_installer_idx" ON "receipts" USING btree ("installer_id");--> statement-breakpoint
CREATE INDEX "receipts_status_idx" ON "receipts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_dedupe_idx" ON "receipts" USING btree ("wholesaler_oib","invoice_number","buyer_oib","total_cents");--> statement-breakpoint
CREATE INDEX "redemptions_installer_idx" ON "redemptions" USING btree ("installer_id");