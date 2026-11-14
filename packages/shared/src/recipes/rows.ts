// How a recipe is stored: one row, plus one row per block in order (body = the block minus id/kind).
// Pure, so the API's seed and its reads share it and a round trip is testable.

import type { Recipe, StepBlock } from "../types.js";

export interface RecipeRow {
  slug: string;
  title: string;
  summary: string;
  chef: string;
  category: string;
  dietary: string[];
  serves: number;
  colourway: string;
  image: string | null;
  imageCredit: { name: string; url: string } | null;
  video: string | null;
  youtube: string | null;
  premium: boolean;
  realTime: boolean;
  source: { url: string; name: string } | null;
  ingredients: Recipe["ingredients"];
}

export interface BlockRow {
  recipeSlug: string;
  position: number;
  blockId: string;
  kind: string;
  body: Record<string, unknown>;
}

export function recipeToRows(r: Recipe): { recipe: RecipeRow; blocks: BlockRow[] } {
  return {
    recipe: {
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      chef: r.chef,
      category: r.category,
      dietary: r.dietary,
      serves: r.serves,
      colourway: r.colourway,
      image: r.image ?? null,
      imageCredit: r.imageCredit ?? null,
      video: r.video ?? null,
      youtube: r.youtube ?? null,
      premium: r.premium,
      realTime: Boolean(r.realTime),
      source: r.source ?? null,
      ingredients: r.ingredients,
    },
    blocks: r.blocks.map(({ id, kind, ...body }, position) => ({ recipeSlug: r.slug, position, blockId: id, kind, body })),
  };
}

/** Optional fields come back only when set, so a recipe round-trips exactly. */
export function recipeFromRows(row: RecipeRow, blocks: BlockRow[]): Recipe {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    chef: row.chef,
    category: row.category,
    dietary: row.dietary,
    serves: row.serves,
    colourway: row.colourway as Recipe["colourway"],
    ...(row.image ? { image: row.image } : {}),
    ...(row.imageCredit ? { imageCredit: row.imageCredit } : {}),
    ...(row.video ? { video: row.video } : {}),
    ...(row.youtube ? { youtube: row.youtube } : {}),
    premium: row.premium,
    ...(row.realTime ? { realTime: true } : {}),
    ...(row.source ? { source: row.source } : {}),
    ingredients: row.ingredients,
    blocks: [...blocks].sort((a, b) => a.position - b.position).map((b) => ({ id: b.blockId, kind: b.kind, ...b.body }) as StepBlock),
  };
}
