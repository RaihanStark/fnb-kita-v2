CREATE TABLE "closing_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by_user_id" uuid,
	"date" date NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"step_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"step1_completed_at" timestamp,
	"step2_completed_at" timestamp,
	"step3_completed_at" timestamp,
	"step4_completed_at" timestamp,
	"step5_completed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "closing_procedures" ADD CONSTRAINT "closing_procedures_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "closing_procedures_date_idx" ON "closing_procedures" USING btree ("date");