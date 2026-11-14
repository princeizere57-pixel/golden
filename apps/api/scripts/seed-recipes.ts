// Seeds Golden's own recipes (from @golden/shared) into the recipes / recipe_blocks tables.
// Adds recipes that aren't there yet; --force overwrites existing ones from the code copy.
// After seeding, the database is the source: edit with `pnpm db:studio`.
// Run from apps/api: pnpm exec tsx scripts/seed-recipes.ts [--force]
import "dotenv/config";
import { RECIPES, recipeToRows } from "@golden/shared";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../src/db/client.js";
import { recipeBlocks, recipes } from "../src/db/schema.js";

const force = process.argv.includes("--force");
const db = getDb();
const existing = new Set((await db.select({ slug: recipes.slug }).from(recipes)).map((r) => r.slug));
let written = 0;
for (const recipe of RECIPES) {
  if (existing.has(recipe.slug) && !force) continue;
  const { recipe: row, blocks } = recipeToRows(recipe);
  await db.batch([
    db
      .insert(recipes)
      .values(row)
      .onConflictDoUpdate({ target: recipes.slug, set: { ...row, updatedAt: sql`now()` } }),
    db.delete(recipeBlocks).where(eq(recipeBlocks.recipeSlug, recipe.slug)),
    db.insert(recipeBlocks).values(blocks),
  ]);
  written++;
}
console.log(`recipes: ${written} written, ${RECIPES.length - written} left as they are${force ? "" : " (use --force to overwrite)"}.`);
