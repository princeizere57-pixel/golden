// Golden's own recipes, from the API's recipes tables, so they can change without a deploy
// (refreshed at most every 5 minutes). If the API can't be reached, the bundled copy keeps the
// app working. Server-only.

import "server-only";
import { cache } from "react";
import { apiOrigin } from "@/lib/api-origin";
import { RECIPES } from "@/lib/data/recipes";
import type { Recipe } from "@/lib/types";

/** Once per request however many components ask. */
export const catalogue = cache(async (): Promise<Recipe[]> => {
  try {
    const res = await fetch(`${apiOrigin()}/recipes`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000) });
    const list = res.ok ? ((await res.json()) as { recipes?: Recipe[] }).recipes : undefined;
    if (Array.isArray(list) && list.length) return list;
  } catch {
    // Unreachable or slow: fall through to the bundled copy.
  }
  return RECIPES;
});

export const catalogueRecipe = async (slug: string): Promise<Recipe | undefined> => (await catalogue()).find((r) => r.slug === slug);
