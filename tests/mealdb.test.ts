import { describe, expect, it } from "vitest";
import { mealIngredients, mealSteps, mealToRecipe, thumb, type Meal } from "@/lib/mealdb/convert";
import { adaptRecipe } from "@/lib/skill/adapt";

// Original fixture in TheMealDB's response shape.
const meal: Meal = {
  idMeal: "90001",
  strMeal: "Test Tomato Soup",
  strCategory: "Vegetarian",
  strArea: "British",
  strInstructions: "STEP 1\r\nSoften the onion in the butter over medium heat for 8 minutes.\r\n\r\nSTEP 2\r\nAdd the tomatoes and stock, then simmer for 20 minutes until thick.\r\n3. Blend until smooth and season.",
  strMealThumb: "https://www.themealdb.com/images/media/meals/test.jpg",
  strSource: "",
  strIngredient1: "Onion",
  strMeasure1: "1 large",
  strIngredient2: "Butter",
  strMeasure2: "25g",
  strIngredient3: "Chopped Tomatoes",
  strMeasure3: "800g",
  strIngredient4: "Vegetable Stock",
  strMeasure4: "500ml",
  strIngredient5: "",
  strMeasure5: " ",
  strIngredient6: null,
  strMeasure6: null,
};

describe("TheMealDB conversion", () => {
  it("splits steps and drops STEP labels and numbering", () => {
    expect(mealSteps(meal.strInstructions)).toEqual([
      "Soften the onion in the butter over medium heat for 8 minutes.",
      "Add the tomatoes and stock, then simmer for 20 minutes until thick.",
      "Blend until smooth and season.",
    ]);
    expect(mealSteps(null)).toEqual([]);
  });

  it("pairs ingredients with measures and skips blanks", () => {
    expect(mealIngredients(meal)).toEqual(["1 large Onion", "25g Butter", "800g Chopped Tomatoes", "500ml Vegetable Stock"]);
  });

  it("builds a credited recipe the skill engine can adapt", () => {
    const r = mealToRecipe(meal)!;
    expect(r.slug).toBe("mealdb-90001");
    expect(r.summary).toBe("British · Vegetarian");
    expect(r.dietary).toEqual(["vegetarian"]);
    expect(r.image).toBe(meal.strMealThumb);
    expect(r.source).toEqual({ url: "https://www.themealdb.com/meal/90001", name: "TheMealDB" });
    expect(r.ingredients[1]).toMatchObject({ quantity: 25, unit: "g", name: "Butter" });
    expect(r.blocks.map((b) => [b.kind, b.attention, b.minutes])).toEqual([
      ["heat", "active", 8],
      ["timing", "passive", 20],
      ["prep", "active", 1],
    ]);
    expect(adaptRecipe(r, "beginner").steps).toHaveLength(3);
  });

  it("rejects meals without steps or ingredients", () => {
    expect(mealToRecipe({ ...meal, strInstructions: "" })).toBeNull();
    expect(mealToRecipe({ idMeal: "1", strMeal: "Empty", strInstructions: "Cook it." })).toBeNull();
  });

  it("uses the 350 px variant once", () => {
    expect(thumb("https://x/a.jpg/medium")).toBe("https://x/a.jpg/medium");
  });
});
