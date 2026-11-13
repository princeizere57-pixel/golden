import { describe, expect, it } from "vitest";
import { covers, pantrySuggestions, parseFridge, rankMeals } from "@/lib/pantry";

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

describe("pantry suggestions", () => {
  it("counts a family word: pasta covers penne, cheese covers parmesan, not eggplant for egg", () => {
    expect(covers("pasta", "Penne Rigate")).toBe(true);
    expect(covers("cheese", "Parmesan")).toBe(true);
    expect(covers("eggs", "Egg Yolks")).toBe(true);
    expect(covers("egg", "Eggplant")).toBe(false);
  });

  it("suggests meals from only two or three items, best covered first", () => {
    const recipes = [
      { slug: "carbonara", ingredients: ["Spaghetti", "Eggs", "Pecorino", "Guanciale", "Black Pepper"] },
      { slug: "egg-fried-rice", ingredients: ["Rice", "Eggs", "Soy Sauce"] },
      { slug: "curry", ingredients: ["Chicken", "Coconut Milk", "Curry Paste"] },
    ];
    const s = pantrySuggestions(recipes, ["eggs", "rice", "pasta"]);
    expect(s.map((m) => m.recipe.slug)).toEqual(["egg-fried-rice", "carbonara"]);
    expect(pantrySuggestions(recipes, [])).toEqual([]);
  });
});

describe("pantry typing", () => {
  it("matches spaced spellings: chick peas covers chickpeas", () => {
    expect(covers("chick peas", "Chickpeas")).toBe(true);
    expect(covers("chick peas", "Tinned chickpeas")).toBe(true);
  });

  it("completes what's being typed to the commonest ingredient", async () => {
    const { completeIngredient } = await import("@/components/pantry");
    const recipes = [
      { slug: "a", href: "/a", title: "A", ingredients: ["Chicken thighs", "Garlic"] },
      { slug: "b", href: "/b", title: "B", ingredients: ["Chicken breast", "Chickpeas"] },
    ];
    expect(completeIngredient("Chick", recipes)).toBe("chicken");
    expect(completeIngredient("chick pe", recipes)).toBe("chickpeas");
    expect(completeIngredient("ch", recipes)).toBeUndefined();
  });
});
