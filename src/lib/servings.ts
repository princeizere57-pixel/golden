// Scales a recipe's ingredients to a different number of servings, with kitchen-friendly
// rounding (5 g steps for bigger weights, quarter spoons and cups, half pieces). Pure, so tested.

import type { Ingredient } from "@/lib/types";

/** The serving choices offered on recipe pages. */
export const SERVING_CHOICES = [1, 2, 4, 6] as const;

const FRACTIONS: [number, string][] = [[0.25, "¼"], [0.5, "½"], [0.75, "¾"], [1 / 3, "⅓"], [2 / 3, "⅔"]];

/** 1.5 → "1½", 0.25 → "¼", 3 → "3". */
export function fractionText(n: number): string {
  const whole = Math.floor(n);
  const rest = n - whole;
  if (rest < 0.05) return String(whole);
  const near = FRACTIONS.find(([v]) => Math.abs(rest - v) < 0.05);
  if (near) return `${whole || ""}${near[1]}`;
  return String(Math.round(n * 10) / 10);
}

/** A quantity scaled by `factor`, rounded the way a cook would measure it. */
export function scaleQuantity(quantity: number, unit: Ingredient["unit"], factor: number): number {
  const q = quantity * factor;
  if (q <= 0) return 0;
  switch (unit) {
    case "g":
    case "ml":
      return q >= 20 ? Math.round(q / 5) * 5 : Math.max(1, Math.round(q));
    case "tsp":
    case "tbsp":
    case "cup":
      return Math.max(0.25, Math.round(q * 4) / 4);
    case "pc":
      return Math.max(0.5, Math.round(q * 2) / 2);
    case "pinch":
      return Math.max(1, Math.round(q));
  }
}

/** "200 g", "1½ tbsp", "2", "1 pinch"; empty when the recipe gave no amount. */
export function formatQuantity(quantity: number, unit: Ingredient["unit"]): string {
  if (!quantity) return "";
  const n = unit === "g" || unit === "ml" ? String(quantity) : fractionText(quantity);
  if (unit === "pc") return n;
  if (unit === "pinch") return `${n} pinch${quantity > 1 ? "es" : ""}`;
  return `${n} ${unit}`;
}

/**
 * Ingredients for `servings` people. Lines the recipe gave without a number (imports and
 * TheMealDB "to taste" lines) stay as written.
 */
export function scaleIngredients(ingredients: Ingredient[], from: number, servings: number): Ingredient[] {
  const factor = from > 0 ? servings / from : 1;
  if (factor === 1) return ingredients;
  return ingredients.map((i) => (i.quantity ? { ...i, quantity: scaleQuantity(i.quantity, i.unit, factor), raw: undefined } : i));
}
