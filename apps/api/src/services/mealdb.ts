import { MEALDB_MIN_MEALS, sweepMealDb, type CachedMeal } from "@golden/shared";
import { asc, eq, ilike, isNotNull, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { mealdbMeals } from "../db/schema.js";

type Row = typeof mealdbMeals.$inferSelect;
const toMeal = (r: Row): CachedMeal => ({
  idMeal: r.id,
  strMeal: r.name,
  strCategory: r.category,
  strArea: r.area,
  strInstructions: r.instructions,
  strMealThumb: r.thumb,
  strYoutube: r.youtube,
  strSource: r.source,
  dateModified: r.dateModified,
  ingredients: r.ingredients,
});

/**
 * Mirrors TheMealDB into mealdb_meals. Upserts only: new meals are added, edited ones updated,
 * removed ones kept. A bad answer (fewer than MEALDB_MIN_MEALS) writes nothing, so yesterday's copy stays.
 */
export async function syncMealDb(key: string | undefined, budgetMs = 45_000) {
  const started = Date.now();
  const { meals, keyed } = await sweepMealDb({ key, deadline: started + budgetMs, log: console.log });
  if (meals.length < MEALDB_MIN_MEALS) return { ok: false as const, count: meals.length, keyed, ms: Date.now() - started };
  const db = getDb();
  for (let i = 0; i < meals.length; i += 200) {
    await db
      .insert(mealdbMeals)
      .values(
        meals.slice(i, i + 200).map((m) => ({
          id: m.idMeal,
          name: m.strMeal,
          category: m.strCategory,
          area: m.strArea,
          instructions: m.strInstructions,
          thumb: m.strMealThumb,
          youtube: m.strYoutube,
          source: m.strSource,
          ingredients: m.ingredients,
          dateModified: m.dateModified ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: mealdbMeals.id,
        set: {
          name: sql`excluded.name`,
          category: sql`excluded.category`,
          area: sql`excluded.area`,
          instructions: sql`excluded.instructions`,
          thumb: sql`excluded.thumb`,
          youtube: sql`excluded.youtube`,
          source: sql`excluded.source`,
          ingredients: sql`excluded.ingredients`,
          dateModified: sql`excluded.date_modified`,
          updatedAt: sql`now()`,
        },
      });
  }
  return { ok: true as const, count: meals.length, keyed, ms: Date.now() - started };
}

/** All meals (the web build's snapshot), or a name search / one category. */
export async function listMeals({ q, category, limit }: { q?: string; category?: string; limit?: number }) {
  const db = getDb();
  const where = q ? ilike(mealdbMeals.name, `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`) : category ? eq(mealdbMeals.category, category) : undefined;
  const query = db.select().from(mealdbMeals).where(where).orderBy(asc(mealdbMeals.name));
  return (await (limit ? query.limit(limit) : query)).map(toMeal);
}

export async function getMeal(id: string) {
  const [row] = await getDb().select().from(mealdbMeals).where(eq(mealdbMeals.id, id)).limit(1);
  return row ? toMeal(row) : null;
}

export async function mealCategories() {
  const rows = await getDb().selectDistinct({ c: mealdbMeals.category }).from(mealdbMeals).where(isNotNull(mealdbMeals.category)).orderBy(asc(mealdbMeals.category));
  return rows.map((r) => r.c as string);
}
