CREATE TABLE "mealdb_meals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"area" text,
	"instructions" text NOT NULL,
	"thumb" text,
	"youtube" text,
	"source" text,
	"ingredients" jsonb NOT NULL,
	"date_modified" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_blocks" (
	"recipe_slug" text NOT NULL,
	"position" integer NOT NULL,
	"block_id" text NOT NULL,
	"kind" text NOT NULL,
	"body" jsonb NOT NULL,
	CONSTRAINT "recipe_blocks_recipe_slug_position_pk" PRIMARY KEY("recipe_slug","position")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"chef" text NOT NULL,
	"category" text NOT NULL,
	"dietary" text[] NOT NULL,
	"serves" integer NOT NULL,
	"colourway" text NOT NULL,
	"image" text,
	"image_credit" jsonb,
	"video" text,
	"youtube" text,
	"premium" boolean NOT NULL,
	"real_time" boolean DEFAULT false NOT NULL,
	"source" jsonb,
	"ingredients" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_blocks" ADD CONSTRAINT "recipe_blocks_recipe_slug_recipes_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "public"."recipes"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mealdb_meals_category_idx" ON "mealdb_meals" USING btree ("category");