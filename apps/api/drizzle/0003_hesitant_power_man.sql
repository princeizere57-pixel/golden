CREATE TABLE "active_timers" (
	"user_id" uuid NOT NULL,
	"timer_id" text NOT NULL,
	"label" text NOT NULL,
	"recipe_slug" text NOT NULL,
	"ends_at" bigint NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "active_timers_user_id_timer_id_pk" PRIMARY KEY("user_id","timer_id")
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"level" text NOT NULL,
	"dish" text NOT NULL,
	"note" text NOT NULL,
	"asks_for_help" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"level" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"rating" smallint NOT NULL,
	"message" text,
	"meals_finished" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_memory" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"sent" boolean NOT NULL,
	"skipped_at" integer
);
--> statement-breakpoint
CREATE TABLE "imported_recipes" (
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"source_url" text,
	"recipe" jsonb NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "imported_recipes_user_id_slug_pk" PRIMARY KEY("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "kitchen_log" (
	"user_id" uuid NOT NULL,
	"entry_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"image" text,
	"at" bigint NOT NULL,
	CONSTRAINT "kitchen_log_user_id_entry_id_pk" PRIMARY KEY("user_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "pantry_items" (
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "pantry_items_user_id_name_pk" PRIMARY KEY("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "plan_done" (
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "plan_done_user_id_slug_pk" PRIMARY KEY("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"xp" integer NOT NULL,
	"streak" integer NOT NULL,
	"last_cook_day" text,
	"dishes" integer NOT NULL,
	"mood" jsonb,
	"avatar" jsonb NOT NULL,
	"cap_day" text,
	"cooked_today" integer DEFAULT 0 NOT NULL,
	"fixed_today" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_recipes" (
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"href" text NOT NULL,
	"title" text NOT NULL,
	"image" text,
	"minutes" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "saved_recipes_user_id_slug_pk" PRIMARY KEY("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "shopping_items" (
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"text" text NOT NULL,
	"recipe_title" text NOT NULL,
	"href" text NOT NULL,
	"done" boolean NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "shopping_items_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_memory" ADD CONSTRAINT "feedback_memory_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imported_recipes" ADD CONSTRAINT "imported_recipes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_log" ADD CONSTRAINT "kitchen_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_done" ADD CONSTRAINT "plan_done_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_created_idx" ON "community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "community_replies_post_idx" ON "community_replies" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "feedback_created_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "kitchen_log_user_at_idx" ON "kitchen_log" USING btree ("user_id","at");