import type { Recipe } from "@/lib/types";

/** Where a recipe lives: seed recipes, TheMealDB meals and private imports have different routes. */
export function recipeHref(recipe: Pick<Recipe, "slug">): string {
  if (recipe.slug.startsWith("mealdb-")) return `/meals/${recipe.slug.slice("mealdb-".length)}`;
  if (recipe.slug.startsWith("my-")) return `/my/${recipe.slug}`;
  return `/recipes/${recipe.slug}`;
}

/**
 * Minutes from first step to plate. Steps done `during` an earlier passive block overlap it, so
 * they only add time if they run past the end of that block.
 */
export function elapsedMinutes(blocks: Recipe["blocks"]): number {
  const ends = new Map<string, number>();
  let clock = 0;
  for (const b of blocks) {
    const host = b.during ? blocks.find((x) => x.id === b.during) : undefined;
    if (host && ends.has(host.id)) {
      // Starts when its host started; pushes the clock only if it outlasts the host.
      const hostEnd = ends.get(host.id)!;
      const hostStart = hostEnd - host.minutes;
      const siblings = blocks.filter((x) => x.during === host.id && blocks.indexOf(x) < blocks.indexOf(b));
      const start = hostStart + siblings.reduce((s, x) => s + x.minutes, 0);
      ends.set(b.id, start + b.minutes);
      clock = Math.max(clock, start + b.minutes);
    } else {
      clock += b.minutes;
      ends.set(b.id, clock);
    }
  }
  return clock;
}

export const totalMinutes = (recipe: Pick<Recipe, "blocks">) => Math.round(elapsedMinutes(recipe.blocks));

/** "45 mins", "1 hr", "1 hr 10 mins". */
export function formatDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} mins`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} mins` : `${h} hr`;
}

/** A "back" address from the query string, accepted only when it points inside the meal plan. */
export const safePlanBack = (back: string | undefined) => (back && /^\/plan(\?[\w%=&.-]*)?$/.test(back) ? back : undefined);

/** Meal plans hold up to this many dishes. */
export const MAX_DISHES = 4;

/** Address of a meal plan, optionally opened on one dish. */
export const planHref = (slugs: string[], active?: string) =>
  `/plan?${slugs.map((s) => `dish=${encodeURIComponent(s)}`).join("&")}${active ? `&active=${encodeURIComponent(active)}` : ""}`;
