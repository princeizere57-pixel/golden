import { describe, expect, it } from "vitest";
import { parseFridge, rankMeals } from "@/lib/pantry";

describe("pantry-to-plate matcher", () => {
  it("reads what people type about their fridge", () => {
    expect(parseFridge("2 eggs, half an onion and some rice\nspinach, eggs")).toEqual(["eggs", "onion", "rice", "spinach"]);
    expect(parseFridge("leftover chicken + 1 tin of tomatoes; garlic")).toEqual(["chicken", "tomatoes", "garlic"]);
    expect(parseFridge("  ,, and ")).toEqual([]);
  });

  it("ranks meals by how much the fridge covers, instant meals first", () => {
    const recipes = [
      { slug: "omelette", ingredients: ["Eggs", "Spinach", "Salt", "Butter"] },
      { slug: "fried-rice", ingredients: ["Rice", "Eggs", "Onion", "Soy Sauce"] },
      { slug: "curry", ingredients: ["Chicken", "Coconut Milk", "Curry Paste", "Rice"] },
    ];
    const ranked = rankMeals(recipes, parseFridge("eggs, spinach, rice, onion"));
    expect(ranked.map((m) => m.recipe.slug)).toEqual(["omelette", "fried-rice"]);
    expect(ranked[0].instant).toBe(true);
    expect(ranked[1]).toMatchObject({ instant: false, match: { missing: ["Soy Sauce"] } });
    expect(rankMeals(recipes, [])).toEqual([]);
  });

  it("prefers meals that use up more of the fridge over tiny exact matches", () => {
    const recipes = [
      { slug: "plain-rice", ingredients: ["Rice", "Salt"] },
      { slug: "stir-fry", ingredients: ["Eggs", "Rice", "Onion", "Chicken", "Tomatoes"] },
    ];
    expect(rankMeals(recipes, parseFridge("eggs, rice, onion, chicken, spinach")).map((m) => m.recipe.slug)).toEqual(["stir-fry", "plain-rice"]);
  });
});
