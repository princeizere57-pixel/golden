CREATE TABLE "orders" (
	"order_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"offer" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"whop_payment_id" text,
	"referred_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"status" text NOT NULL,
	"user_id" text,
	"whop_user_id" text,
	"current_period_end" timestamp with time zone,
	"offer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_provider_external_id_pk" PRIMARY KEY("provider","external_id")
);
--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_whop_user_idx" ON "subscriptions" USING btree ("whop_user_id");