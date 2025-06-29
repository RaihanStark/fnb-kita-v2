CREATE TYPE "public"."stock_type" AS ENUM('product', 'packaging', 'utilities', 'consumables');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('pcs', 'box', 'kg', 'liter', 'pack');--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "stock_type" NOT NULL,
	"unit" "unit_type" NOT NULL,
	"current_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"min_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cost_per_unit" numeric(10, 2),
	"notes" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
