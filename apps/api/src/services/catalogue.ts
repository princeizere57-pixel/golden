import { recipeFromRows, type BlockRow, type Recipe } from "@golden/shared";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { recipeBlocks, recipes } from "../db/schema.js";

const assemble = (rows: (typeof recipes.$inferSelect)[], blocks: BlockRow[]): Recipe[] =>
  rows.map((r) =>
    recipeFromRows(
      r,
      blocks.filter((b) => b.recipeSlug === r.slug),
    ),
  );

/** Golden's own recipes with their blocks in order (one round trip). */
export async function listRecipes(): Promise<Recipe[]> {
  const db = getDb();
  const [rows, blocks] = await db.batch([db.select().from(recipes).orderBy(asc(recipes.slug)), db.select().from(recipeBlocks).orderBy(asc(recipeBlocks.position))]);
  return assemble(rows, blocks);
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const db = getDb();
  const [rows, blocks] = await db.batch([db.select().from(recipes).where(eq(recipes.slug, slug)).limit(1), db.select().from(recipeBlocks).where(eq(recipeBlocks.recipeSlug, slug))]);
  return rows[0] ? assemble(rows, blocks)[0] : null;
}
