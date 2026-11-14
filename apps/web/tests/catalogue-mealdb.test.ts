import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogue, catalogueRecipe } from "@/lib/catalogue";
import { RECIPES } from "@/lib/data/recipes";
import { cleanMeal, recipeFromRows, recipeToRows } from "@/lib/types";

afterEach(() => vi.unstubAllGlobals());

describe("catalogue (Golden's own recipes)", () => {
  it("serves the API's copy when it answers", async () => {
    const edited = { ...RECIPES[0], title: "Edited in the database" };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ recipes: [edited] }) } as Response)));
    expect((await catalogue()).map((r) => r.title)).toEqual(["Edited in the database"]);
  });

  it("falls back to the bundled recipes when the API is down or empty", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    expect(await catalogue()).toBe(RECIPES);
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ recipes: [] }) } as Response)));
    expect((await catalogueRecipe("garlic-butter-pasta"))?.slug).toBe("garlic-butter-pasta");
  });
});

describe("recipe rows (how the API stores a recipe)", () => {
  it("round-trips every bundled recipe exactly, blocks in order", () => {
    for (const recipe of RECIPES) {
      const { recipe: row, blocks } = recipeToRows(recipe);
      expect(recipeFromRows(row, [...blocks].reverse())).toEqual(recipe);
    }
  });
});

describe("cleanMeal (TheMealDB → stored meal)", () => {
  const raw = { idMeal: " 52772 ", strMeal: "Teriyaki Chicken", strInstructions: "Cook it.", strMealThumb: "https://img/x.jpg", strIngredient1: "soy sauce", strMeasure1: " 3/4 cup ", strIngredient2: "", strMeasure2: "1 tbsp" };

  it("keeps the fields the app uses and lists the ingredients", () => {
    expect(cleanMeal(raw)).toMatchObject({ idMeal: "52772", strMeal: "Teriyaki Chicken", ingredients: [{ name: "soy sauce", measure: "3/4 cup" }] });
  });

  it("drops meals without a photo, steps or ingredients", () => {
    expect(cleanMeal({ ...raw, strMealThumb: " " })).toBeNull();
    expect(cleanMeal({ ...raw, strInstructions: null })).toBeNull();
    expect(cleanMeal({ ...raw, strIngredient1: null })).toBeNull();
  });
});
