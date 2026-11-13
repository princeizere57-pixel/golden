// "Cook it with": second dishes for a recipe page, each opening Plan a meal with both dishes
// timed to finish together. Prefers a different category (a side next to a main), then quicker
// dishes. Pure.

import { formatDuration, planHref, totalMinutes } from "@/lib/links";
import { thumb } from "@/lib/mealdb/convert";
import type { Recipe } from "@/lib/types";

export interface PairingCard {
  slug: string;
  title: string;
  image?: string;
  minutes: string;
  href: string;
}

export function pairingsFor(recipe: Pick<Recipe, "slug" | "category">, pool: Recipe[], count = 4): PairingCard[] {
  return pool
    .filter((r) => r.slug !== recipe.slug && !r.premium)
    .map((r) => ({ r, score: (r.category !== recipe.category ? 0 : 1000) + totalMinutes(r) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map(({ r }) => ({
      slug: r.slug,
      title: r.title,
      image: r.image ? thumb(r.image) : undefined,
      minutes: formatDuration(totalMinutes(r)),
      href: planHref([recipe.slug, r.slug], recipe.slug),
    }));
}
