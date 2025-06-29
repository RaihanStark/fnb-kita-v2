CREATE TABLE "opening_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
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
ALTER TABLE "opening_procedures" ADD CONSTRAINT "opening_procedures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;