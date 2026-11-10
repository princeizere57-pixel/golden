import { afterEach, describe, expect, it } from "vitest";
import { generateRecipe, recipePrompt } from "@/lib/ai/generate-recipe";
import { GENERATED_SOURCE, cleanDish, generatedToRecipe, parseGeneratedRecipe } from "@/lib/ai/generated-recipe";
import { RECIPES } from "@/lib/data/recipes";
import { saveImport, listImports } from "@/lib/import/store";
import { matchesQuery, mergeResults } from "@/lib/search";

const reply = {
  title: "Chicken Katsu Curry",
  summary: "Crisp breaded chicken with a mild, sweet curry sauce.",
  serves: 2,
  ingredients: ["2 chicken breasts", "50 g panko breadcrumbs", "1 onion, chopped", "1 tbsp curry powder", "300 ml chicken stock"],
  steps: ["Put the rice on to cook.", "Fry the onion over medium heat until soft, about 5 minutes.", "Coat the chicken and fry until golden, 4 minutes a side.", "Simmer the sauce for 10 minutes until it coats a spoon."],
};

describe("generated recipes", () => {
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("accepts a well-formed recipe and rejects thin, broken or non-dish replies", () => {
    expect(parseGeneratedRecipe(reply)).toMatchObject({ title: "Chicken Katsu Curry", serves: 2 });
    expect(parseGeneratedRecipe({ error: "not a dish" })).toBeNull();
    expect(parseGeneratedRecipe({ title: "x", ingredients: ["a"], steps: ["b", "c"] })).toBeNull();
    expect(parseGeneratedRecipe("nope")).toBeNull();
    expect(parseGeneratedRecipe({ ...reply, serves: 99 })?.serves).toBe(2);
    expect(parseGeneratedRecipe({ ...reply, ingredients: Array(50).fill("1 egg") })?.ingredients).toHaveLength(30);
  });

  it("becomes a private Golden recipe that works in cook mode", () => {
    const r = generatedToRecipe(parseGeneratedRecipe(reply)!, "abc12345");
    expect(r.slug).toBe("my-abc12345");
    expect(r.category).toBe("Written for you");
    expect(r.source).toEqual({ name: GENERATED_SOURCE, url: "" });
    expect(r.blocks).toHaveLength(4);
    expect(r.ingredients[0]).toMatchObject({ name: expect.stringMatching(/chicken/i) });
  });

  it("cleans what people type", () => {
    expect(cleanDish("  chicken <katsu> curry!!  ")).toBe("chicken katsu curry");
    expect(cleanDish("a")).toBeNull();
    expect(cleanDish(5)).toBeNull();
  });

  it("asks Gemini for an original recipe and parses its JSON", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    let prompt = "";
    const fake = (async (_url: string | URL, init?: RequestInit) => {
      prompt = JSON.parse(String(init?.body)).contents[0].parts[0].text;
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }));
    }) as typeof fetch;
    expect((await generateRecipe("chicken katsu curry", { fetchImpl: fake }))?.title).toBe("Chicken Katsu Curry");
    expect(prompt).toContain("ORIGINAL");
    expect(prompt).toContain('"chicken katsu curry"');
    expect(recipePrompt("x")).toMatch(/Do not reproduce any published recipe/);
  });

  it("falls back to nothing without a key (the UI then offers import)", async () => {
    expect(await generateRecipe("anything", { fetchImpl: (() => { throw new Error("no network in tests"); }) as typeof fetch })).toBeNull();
  });
});

describe("library search", () => {
  it("finds Golden's own recipes by title or ingredient", () => {
    const pasta = RECIPES.find((r) => r.slug === "broccoli-chilli-pasta")!;
    expect(matchesQuery(pasta, "broccoli pasta")).toBe(true);
    expect(matchesQuery(pasta, "Parmesan")).toBe(true);
    expect(matchesQuery(pasta, "katsu")).toBe(false);
    expect(matchesQuery(pasta, "  ")).toBe(false);
  });

  it("puts local matches first and drops duplicates", () => {
    const merged = mergeResults(RECIPES, "rice", [RECIPES.find((r) => r.slug === "fluffy-rice")!]);
    expect(merged[0].slug).toBe("fluffy-rice");
    expect(new Set(merged.map((r) => r.slug)).size).toBe(merged.length);
  });
});

describe("private recipe store", () => {
  it("keeps several generated recipes (they have no source link to de-duplicate on)", () => {
    const mem = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const a = generatedToRecipe(parseGeneratedRecipe(reply)!, "aaaa1111");
    const b = generatedToRecipe(parseGeneratedRecipe({ ...reply, title: "Beef Rendang" })!, "bbbb2222");
    saveImport(a);
    saveImport(b);
    saveImport(a);
    expect(listImports().map((r) => r.slug)).toEqual(["my-aaaa1111", "my-bbbb2222"]);
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });
});
