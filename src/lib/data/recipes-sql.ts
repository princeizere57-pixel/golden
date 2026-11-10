// Turns the seed recipes into SQL for Supabase, so the database holds exactly what the app ships.
// tests/recipes-sql.test.ts checks supabase/migrations/0005_seed_recipes.sql matches this output
// (run it with UPDATE_SQL=1 to rewrite the file after editing recipes).

import type { Recipe } from "@/lib/types";

const text = (v: string | undefined | null) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const json = (v: unknown) => `${text(JSON.stringify(v))}::jsonb`;
const array = (v: string[]) => (v.length ? `array[${v.map(text).join(", ")}]::text[]` : "'{}'::text[]");

export function recipesToSql(recipes: Recipe[]): string {
  const lines = [
    "-- Seed recipes, generated from src/lib/data (recipes.ts + real-time-recipes.ts) by",
    "-- src/lib/data/recipes-sql.ts. Do not edit by hand: change the recipes, then run",
    "-- UPDATE_SQL=1 npx vitest run tests/recipes-sql.test.ts",
    "",
    "alter table recipes add column if not exists real_time boolean not null default false;",
    "",
  ];
  for (const r of recipes) {
    lines.push(
      "insert into recipes (slug, title, summary, chef, category, dietary, serves, colourway, image_url, premium, ingredients, real_time)",
      `values (${[text(r.slug), text(r.title), text(r.summary), text(r.chef), text(r.category), array(r.dietary), r.serves, text(r.colourway), text(r.image), r.premium, json(r.ingredients), Boolean(r.realTime)].join(", ")})`,
      "on conflict (slug) do update set title = excluded.title, summary = excluded.summary, chef = excluded.chef, category = excluded.category, dietary = excluded.dietary, serves = excluded.serves, colourway = excluded.colourway, image_url = excluded.image_url, premium = excluded.premium, ingredients = excluded.ingredients, real_time = excluded.real_time;",
      `delete from recipe_blocks where recipe_slug = ${text(r.slug)};`,
      "insert into recipe_blocks (recipe_slug, position, id, kind, body) values",
      r.blocks
        .map((b, i) => {
          const { id, kind, ...body } = b;
          return `  (${text(r.slug)}, ${i}, ${text(id)}, ${text(kind)}, ${json(body)})`;
        })
        .join(",\n") + ";",
      "",
    );
  }
  return lines.join("\n");
}
