CREATE TYPE "public"."change_status" AS ENUM('pending', 'approved', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_email" text NOT NULL,
	"actor_role" text NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"body" jsonb,
	"section" text DEFAULT 'General' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"fingerprint" text NOT NULL,
	"status" "change_status" DEFAULT 'pending' NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"result_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"phone" text NOT NULL,
	"kind" text NOT NULL,
	"template" text NOT NULL,
	"params" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"text" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"provider_message_id" text,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "whatsapp_outbox_dedupe_key_unique" UNIQUE("dedupe_key"),
	CONSTRAINT "whatsapp_outbox_status_known" CHECK ("whatsapp_outbox"."status" in ('queued','sending','sent','failed','skipped'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_opt_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_opted_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "whatsapp_outbox" ADD CONSTRAINT "whatsapp_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "change_requests_status_idx" ON "change_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "change_requests_actor_idx" ON "change_requests" USING btree ("actor_email");--> statement-breakpoint
CREATE INDEX "whatsapp_outbox_status_idx" ON "whatsapp_outbox" USING btree ("status","id");