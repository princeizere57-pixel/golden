import { describe, expect, it } from "vitest";
import { fromCached, mealIngredients, mealSteps, mealToRecipe, thumb, type CachedMeal, type Meal } from "@/lib/mealdb/convert";
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

  it("round-trips the cached shape back into a meal", () => {
    const cached: CachedMeal = {
      idMeal: meal.idMeal,
      strMeal: meal.strMeal,
      strCategory: "Vegetarian",
      strArea: "British",
      strInstructions: meal.strInstructions!,
      strMealThumb: meal.strMealThumb!,
      strYoutube: null,
      strSource: null,
      ingredients: [
        { name: "Onion", measure: "1 large" },
        { name: "Butter", measure: "25g" },
        { name: "Chopped Tomatoes", measure: "800g" },
        { name: "Vegetable Stock", measure: "500ml" },
      ],
    };
    expect(mealToRecipe(fromCached(cached))).toEqual(mealToRecipe(meal));
  });

  it("uses the 350 px variant once", () => {
    expect(thumb("https://x/a.jpg/medium")).toBe("https://x/a.jpg/medium");
  });
});

describe("ingredient pictures and videos", () => {
  it("keeps TheMealDB's ingredient names and the YouTube ID", async () => {
    const { mealToRecipe, youtubeId } = await import("@/lib/mealdb/convert");
    const { ingredientIconUrl } = await import("@/lib/ingredient-icons");
    const r = mealToRecipe({ ...meal, strYoutube: "https://www.youtube.com/watch?v=1IszT_guI08" })!;
    expect(r.ingredients[2].icon).toBe("Chopped Tomatoes");
    expect(r.youtube).toBe("1IszT_guI08");
    expect(youtubeId("https://youtu.be/1IszT_guI08")).toBe("1IszT_guI08");
    expect(youtubeId("")).toBeUndefined();
    expect(ingredientIconUrl(r.ingredients[2])).toBe("https://www.themealdb.com/images/ingredients/Chopped%20Tomatoes-Small.png");
    expect(ingredientIconUrl({ name: "chopped garlic" })).toBe("https://www.themealdb.com/images/ingredients/Garlic-Small.png");
  });
});

describe("step pictures", () => {
  it("finds the ingredients a step mentions", async () => {
    const { ingredientsInStep } = await import("@/lib/ingredient-icons");
    const ings = [
      { id: "a", name: "Garlic", quantity: 2, unit: "pc" as const, icon: "Garlic" },
      { id: "b", name: "Chopped Tomatoes", quantity: 400, unit: "g" as const, icon: "Chopped Tomatoes" },
      { id: "c", name: "Olive Oil", quantity: 1, unit: "tbsp" as const, icon: "Olive Oil" },
    ];
    expect(ingredientsInStep(ings, "Fry the garlic in the oil, then add the tomatoes.").map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(ingredientsInStep(ings, "Bring water to the boil.")).toEqual([]);
    expect(ingredientsInStep(ings, "anything", ["b"]).map((i) => i.id)).toEqual(["b"]);
  });
});
