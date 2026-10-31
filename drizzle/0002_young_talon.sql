CREATE TYPE "public"."payment_method" AS ENUM('razorpay', 'cod');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text DEFAULT 'razorpay' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "razorpay_order_id" text;