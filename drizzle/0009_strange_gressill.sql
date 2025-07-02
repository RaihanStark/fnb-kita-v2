CREATE TYPE "public"."payment_method" AS ENUM('cash', 'qris');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" "payment_method";