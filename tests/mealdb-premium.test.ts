import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { latestMealIds, mealIdsWithIngredients } from "@/lib/mealdb/client";
import { recipesWithIngredients, surpriseRecipe } from "@/lib/library";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const reply = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

describe("TheMealDB premium (V2) discovery", () => {
  it("asks the multi-ingredient filter for up to four ingredients, underscored", async () => {
    vi.stubEnv("MEALDB_API_KEY", "");
    const fetch = vi.fn(() => reply({ meals: [{ idMeal: "52772" }, { idMeal: "x" }] }));
    vi.stubGlobal("fetch", fetch);
    expect(await mealIdsWithIngredients(["Chicken breast", "garlic", "lemon", "salt", "pepper"])).toEqual(["52772"]);
    expect(String((fetch.mock.calls[0] as unknown[])[0])).toBe("https://www.themealdb.com/api/json/v2/1/filter.php?i=chicken_breast,garlic,lemon,salt");
  });

  it("uses the supporter key first, then V2 with the test key when the key is refused", async () => {
    vi.stubEnv("MEALDB_API_KEY", "abc123");
    const fetch = vi.fn((url: string) => (url.includes("/v2/1/") ? reply({ meals: [{ idMeal: "53580" }] }) : reply(null, false)));
    vi.stubGlobal("fetch", fetch);
    expect(await latestMealIds()).toEqual(["53580"]);
    const urls = fetch.mock.calls.map((c) => String((c as unknown[])[0]));
    expect(urls[0]).toBe("https://www.themealdb.com/api/json/v2/abc123/latest.php");
    expect(urls.at(-1)).toBe("https://www.themealdb.com/api/json/v2/1/latest.php");
  });

  it("returns nothing (not an error) when TheMealDB can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    expect(await latestMealIds()).toEqual([]);
    expect(await mealIdsWithIngredients([""])).toEqual([]);
  });
});

describe("library fallbacks", () => {
  it("finds recipes that use every listed ingredient", () => {
    const found = recipesWithIngredients(["garlic", "pasta"]);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((r) => r.ingredients.some((i) => /garlic/i.test(i.name)))).toBe(true);
    expect(recipesWithIngredients([])).toEqual([]);
  });

  it("picks a surprise recipe at the cook's level when there is one", () => {
    expect(surpriseRecipe("beginner", () => 0)?.image).toBeTruthy();
  });
});

describe("Supabase", () => {
  it("has the TheMealDB library table with public read in setup_all.sql", () => {
    const sql = readFileSync("supabase/setup_all.sql", "utf8");
    expect(sql).toContain("create table if not exists mealdb_meals");
    expect(sql).toContain('create policy "mealdb meals are public" on mealdb_meals for select using (true);');
  });
});
