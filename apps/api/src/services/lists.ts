import type { LIST_SCHEMAS, ListName } from "@golden/shared";
import { asc, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { z } from "zod";
import { getDb } from "../db/client.js";
import { activeTimers, feedbackMemory, importedRecipes, pantryItems, planDone, savedRecipes, shoppingItems } from "../db/schema.js";

export type ListValue<N extends ListName> = z.output<(typeof LIST_SCHEMAS)[N]>;

/** Every synced list for a user, in the device's shapes and order (one round trip). */
export async function readLists(userId: string) {
  const db = getDb();
  const [saved, shopping, pantry, plan, timers, imports, memory] = await db.batch([
    db.select().from(savedRecipes).where(eq(savedRecipes.userId, userId)).orderBy(asc(savedRecipes.position)),
    db.select().from(shoppingItems).where(eq(shoppingItems.userId, userId)).orderBy(asc(shoppingItems.position)),
    db.select().from(pantryItems).where(eq(pantryItems.userId, userId)).orderBy(asc(pantryItems.position)),
    db.select().from(planDone).where(eq(planDone.userId, userId)).orderBy(asc(planDone.position)),
    db.select().from(activeTimers).where(eq(activeTimers.userId, userId)).orderBy(asc(activeTimers.position)),
    db.select().from(importedRecipes).where(eq(importedRecipes.userId, userId)).orderBy(asc(importedRecipes.position)),
    db.select().from(feedbackMemory).where(eq(feedbackMemory.userId, userId)),
  ]);
  return {
    saved: saved.map((r) => ({ slug: r.slug, href: r.href, title: r.title, ...(r.image ? { image: r.image } : {}), minutes: r.minutes })),
    shopping: shopping.map((r) => ({ id: r.itemId, text: r.text, recipeTitle: r.recipeTitle, href: r.href, done: r.done })),
    pantry: pantry.map((r) => r.name),
    planDone: plan.map((r) => r.slug),
    timers: timers.map((r) => ({ id: r.timerId, label: r.label, recipeSlug: r.recipeSlug, endsAt: r.endsAt })),
    imports: imports.map((r) => r.recipe),
    feedback: memory[0] ? { sent: memory[0].sent, skippedAt: memory[0].skippedAt } : null,
  };
}

/** Swap a user's rows for the new list in one atomic batch. */
async function replace<T extends PgTable>(table: T, userCol: PgColumn, userId: string, rows: T["$inferInsert"][]) {
  const db = getDb();
  const clear = db.delete(table).where(eq(userCol, userId));
  if (!rows.length) return void (await clear);
  await db.batch([clear, db.insert(table).values(rows)]);
}

const replacers: { [N in ListName]: (userId: string, value: ListValue<N>) => Promise<void> } = {
  saved: (userId, items) =>
    replace(savedRecipes, savedRecipes.userId, userId, items.map((r, position) => ({ userId, slug: r.slug, href: r.href, title: r.title, image: r.image ?? null, minutes: r.minutes, position }))),
  shopping: (userId, items) =>
    replace(shoppingItems, shoppingItems.userId, userId, items.map((r, position) => ({ userId, itemId: r.id, text: r.text, recipeTitle: r.recipeTitle, href: r.href, done: r.done, position }))),
  pantry: (userId, names) => replace(pantryItems, pantryItems.userId, userId, names.map((name, position) => ({ userId, name, position }))),
  planDone: (userId, slugs) => replace(planDone, planDone.userId, userId, slugs.map((slug, position) => ({ userId, slug, position }))),
  timers: (userId, items) =>
    replace(activeTimers, activeTimers.userId, userId, items.map((t, position) => ({ userId, timerId: t.id, label: t.label, recipeSlug: t.recipeSlug, endsAt: t.endsAt, position }))),
  imports: (userId, recipes) =>
    replace(
      importedRecipes,
      importedRecipes.userId,
      userId,
      // A slug appears once even if a misbehaving client sends it twice.
      [...new Map(recipes.map((r) => [r.slug, r])).values()].map((recipe, position) => ({ userId, slug: recipe.slug, sourceUrl: recipe.source?.url ?? null, recipe: recipe as never, position })),
    ),
  feedback: async (userId, memory) => {
    await getDb().insert(feedbackMemory).values({ userId, ...memory }).onConflictDoUpdate({ target: feedbackMemory.userId, set: memory });
  },
};

export const replaceList = <N extends ListName>(userId: string, name: N, value: ListValue<N>) =>
  (replacers[name] as (userId: string, value: ListValue<N>) => Promise<void>)(userId, value);
