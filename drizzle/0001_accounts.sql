CREATE TABLE "user_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"recipient_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_wishlist" (
	"user_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_wishlist_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"phone" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist" ADD CONSTRAINT "user_wishlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist" ADD CONSTRAINT "user_wishlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_addresses_user_idx" ON "user_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;