DROP INDEX "opening_procedures_user_date_idx";--> statement-breakpoint
ALTER TABLE "opening_procedures" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "opening_procedures" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "opening_procedures" ADD CONSTRAINT "opening_procedures_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "opening_procedures_date_idx" ON "opening_procedures" USING btree ("date");