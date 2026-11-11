import { describe, expect, it } from "vitest";
import { formatQuantity, fractionText, scaleIngredients, scaleQuantity } from "@/lib/servings";
import { pairingsFor } from "@/lib/pairings";
import { RECIPES } from "@/lib/data/recipes";
import type { Ingredient } from "@/lib/types";

describe("serving presets", () => {
  it("rounds scaled amounts the way a cook measures", () => {
    expect(scaleQuantity(200, "g", 2)).toBe(400);
    expect(scaleQuantity(200, "g", 0.5)).toBe(100);
    expect(scaleQuantity(75, "g", 1 / 3)).toBe(25);
    expect(scaleQuantity(3, "g", 0.5)).toBe(2);
    expect(scaleQuantity(1, "tbsp", 1.5)).toBe(1.5);
    expect(scaleQuantity(1, "tsp", 0.5)).toBe(0.5);
    expect(scaleQuantity(1, "tsp", 0.1)).toBe(0.25);
    expect(scaleQuantity(1, "pc", 0.5)).toBe(0.5);
    expect(scaleQuantity(3, "pc", 2 / 3)).toBe(2);
    expect(scaleQuantity(1, "pinch", 3)).toBe(3);
  });

  it("writes amounts with kitchen fractions", () => {
    expect(fractionText(1.5)).toBe("1½");
    expect(fractionText(0.25)).toBe("¼");
    expect(fractionText(2)).toBe("2");
    expect(formatQuantity(400, "g")).toBe("400 g");
    expect(formatQuantity(1.5, "tbsp")).toBe("1½ tbsp");
    expect(formatQuantity(2, "pc")).toBe("2");
    expect(formatQuantity(2, "pinch")).toBe("2 pinches");
    expect(formatQuantity(0, "g")).toBe("");
  });

  it("scales every measured line and keeps 'to taste' lines as written", () => {
    const ing: Ingredient[] = [
      { id: "a", name: "Spaghetti", quantity: 200, unit: "g" },
      { id: "b", name: "Salt", quantity: 0, unit: "pinch", raw: "Salt to taste" },
    ];
    const four = scaleIngredients(ing, 2, 4);
    expect(four[0].quantity).toBe(400);
    expect(four[1]).toEqual(ing[1]);
    expect(scaleIngredients(ing, 2, 2)).toBe(ing);
  });

  it("pairs a recipe with other free dishes, other categories first, opening a two-dish plan", () => {
    const r = RECIPES[0];
    const cards = pairingsFor(r, RECIPES);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.slug !== r.slug)).toBe(true);
    expect(cards[0].href).toBe(`/plan?dish=${r.slug}&dish=${cards[0].slug}&active=${r.slug}`);
  });
});
