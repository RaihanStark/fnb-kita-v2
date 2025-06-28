CREATE TYPE "public"."registration_status" AS ENUM('invited', 'registered');--> statement-breakpoint
CREATE TYPE "public"."salary_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('Manager', 'Employee');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."expense_type" AS ENUM('personal', 'business');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_status" AS ENUM('pending', 'approved', 'denied', 'paid');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"nama" varchar(255),
	"kontak" varchar(50),
	"posisi" varchar(100),
	"departemen" varchar(100),
	"role" "user_role" DEFAULT 'Employee' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"tanggal_masuk" timestamp,
	"registration_status" "registration_status" DEFAULT 'registered' NOT NULL,
	"salary_amount" numeric(12, 2),
	"salary_frequency" "salary_frequency" DEFAULT 'monthly',
	"limit_reimbursement" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'Employee' NOT NULL,
	"invited_by_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reimbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"expense_type" "expense_type" NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" varchar(500) NOT NULL,
	"receipt_url" varchar(500),
	"status" "reimbursement_status" DEFAULT 'pending' NOT NULL,
	"submitted_date" timestamp DEFAULT now() NOT NULL,
	"manager_id" uuid,
	"manager_comments" varchar(500),
	"manager_action_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;