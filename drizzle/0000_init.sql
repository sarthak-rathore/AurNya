CREATE TYPE "public"."coupon_kind" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"kind" "coupon_kind" NOT NULL,
	"value" integer NOT NULL,
	"min_subtotal_paise" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"max_redemptions" integer,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code"),
	CONSTRAINT "coupons_code_capitals" CHECK ("coupons"."code" = upper("coupons"."code")),
	CONSTRAINT "coupons_value_valid" CHECK (("coupons"."kind" = 'percent' and "coupons"."value" between 1 and 100) or ("coupons"."kind" = 'fixed' and "coupons"."value" > 0)),
	CONSTRAINT "coupons_min_nonneg" CHECK ("coupons"."min_subtotal_paise" >= 0),
	CONSTRAINT "coupons_redemptions_valid" CHECK ("coupons"."redemptions" >= 0 and ("coupons"."max_redemptions" is null or "coupons"."max_redemptions" >= 0)),
	CONSTRAINT "coupons_dates_ordered" CHECK ("coupons"."starts_at" is null or "coupons"."ends_at" is null or "coupons"."ends_at" > "coupons"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"name_snapshot" text NOT NULL,
	"sku_snapshot" text NOT NULL,
	"option_label_snapshot" text,
	"option_value_snapshot" text,
	"unit_price_paise" integer NOT NULL,
	"qty" integer NOT NULL,
	"line_total_paise" integer NOT NULL,
	CONSTRAINT "order_items_qty_positive" CHECK ("order_items"."qty" > 0),
	CONSTRAINT "order_items_price_nonneg" CHECK ("order_items"."unit_price_paise" >= 0),
	CONSTRAINT "order_items_line_adds_up" CHECK ("order_items"."line_total_paise" = "order_items"."unit_price_paise" * "order_items"."qty")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" serial NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"shipping_address" jsonb,
	"coupon_code" text,
	"subtotal_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"shipping_paise" integer DEFAULT 0 NOT NULL,
	"tax_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_amounts_valid" CHECK ("orders"."subtotal_paise" >= 0 and "orders"."discount_paise" >= 0 and "orders"."discount_paise" <= "orders"."subtotal_paise" and "orders"."shipping_paise" >= 0 and "orders"."tax_paise" >= 0),
	CONSTRAINT "orders_total_adds_up" CHECK ("orders"."total_paise" = "orders"."subtotal_paise" - "orders"."discount_paise" + "orders"."shipping_paise" + "orders"."tax_paise")
);
--> statement-breakpoint
CREATE TABLE "product_collections" (
	"product_id" integer NOT NULL,
	"collection_id" integer NOT NULL,
	CONSTRAINT "product_collections_product_id_collection_id_pk" PRIMARY KEY("product_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"option_label" text NOT NULL,
	"option_value" text NOT NULL,
	"sku" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variants_product_option" UNIQUE("product_id","option_value"),
	CONSTRAINT "product_variants_stock_nonneg" CHECK ("product_variants"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category_id" integer NOT NULL,
	"short" text DEFAULT '' NOT NULL,
	"description" text,
	"price_paise" integer NOT NULL,
	"compare_price_paise" integer,
	"stock" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"material" text,
	"dimensions" text,
	"weight" text,
	"image" text,
	"image_alt" text,
	"video" text,
	"seo_title" text,
	"seo_description" text,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_price_nonneg" CHECK ("products"."price_paise" >= 0),
	CONSTRAINT "products_compare_above_price" CHECK ("products"."compare_price_paise" is null or "products"."compare_price_paise" > "products"."price_paise"),
	CONSTRAINT "products_stock_nonneg" CHECK ("products"."stock" >= 0),
	CONSTRAINT "products_tags_known" CHECK ("products"."tags" <@ ARRAY['new','bestseller']::text[])
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_collections_collection_idx" ON "product_collections" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_price_idx" ON "products" USING btree ("price_paise");