// Data-driven home page: an ordered list of segments, each with an optional visibility rule.
// Mob targets segments by plan; we target by plan and skill level.

import { activeMinutes } from "@/lib/skill/adapt";
import type { Recipe, RailFilter, Segment, Viewer, Visibility } from "@/lib/types";

export function isVisible(visibility: Visibility | undefined, viewer: Viewer): boolean {
  if (!visibility) return true;
  if (visibility.plans && !visibility.plans.includes(viewer.plan)) return false;
  if (visibility.skills && !visibility.skills.includes(viewer.skill)) return false;
  return true;
}

export function matchesFilter(recipe: Recipe, filter: RailFilter): boolean {
  if (filter.category && recipe.category !== filter.category) return false;
  if (filter.dietary && !recipe.dietary.includes(filter.dietary)) return false;
  if (filter.chef && recipe.chef !== filter.chef) return false;
  if (filter.maxActiveMinutes !== undefined && activeMinutes(recipe) > filter.maxActiveMinutes) return false;
  return true;
}

export type BuiltSegment =
  | { id: string; type: "recipes"; heading: string; recipes: Recipe[] }
  | { id: string; type: "premiumPromo"; heading: string };

export interface BuildOptions {
  /** Recipes ordered newest first. */
  recipes: Recipe[];
  /** Slugs the viewer has started cooking. */
  inProgress?: string[];
  /** Category chip selected on the feed. */
  category?: string;
}

/** Resolves segments for a viewer, dropping hidden and empty ones. */
export function buildHome(segments: Segment[], viewer: Viewer, { recipes, inProgress = [], category }: BuildOptions): BuiltSegment[] {
  const pool = category ? recipes.filter((r) => r.category === category) : recipes;
  const out: BuiltSegment[] = [];
  for (const segment of segments) {
    if (!isVisible(segment.visibility, viewer)) continue;
    switch (segment.type) {
      case "premiumPromo":
        out.push({ id: segment.id, type: "premiumPromo", heading: segment.heading });
        continue;
      case "rail":
        out.push({ id: segment.id, type: "recipes", heading: segment.heading, recipes: pool.filter((r) => matchesFilter(r, segment.filter)) });
        break;
      case "newRecipes":
        out.push({ id: segment.id, type: "recipes", heading: segment.heading, recipes: pool.slice(0, segment.limit) });
        break;
      case "continueCooking":
        out.push({ id: segment.id, type: "recipes", heading: segment.heading, recipes: pool.filter((r) => inProgress.includes(r.slug)) });
        break;
    }
  }
  return out.filter((s) => s.type !== "recipes" || s.recipes.length > 0);
}

export const categories = (recipes: Recipe[]) => [...new Set(recipes.map((r) => r.category))].sort();
