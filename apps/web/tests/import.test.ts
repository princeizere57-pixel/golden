import { describe, expect, it } from "vitest";
import { isPrivateAddress } from "@/lib/import/fetch";
import { cleanText, extractRecipe } from "@/lib/import/parse";
import { parseIngredient, stepMinutes, stepToBlock, toRecipe } from "@/lib/import/to-blocks";
import { adaptRecipe } from "@/lib/skill/adapt";

// An original fixture page in the shape recipe sites publish (JSON-LD inside @graph).
const page = `<html><head>
<meta property="og:site_name" content="Test Kitchen">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
  {"@type":"WebSite","name":"Test Kitchen"},
  {"@type":["Recipe"],"name":"Lemon &amp; Herb Couscous","description":"<p>A quick side.</p>",
   "author":{"@type":"Person","name":"Sam Cook"},"recipeYield":["4","4 servings"],"image":[{"@type":"ImageObject","url":"https://img.example.com/couscous.jpg"}],
   "recipeIngredient":["200g couscous","1½ tbsp olive oil","2 lemons, zested","300ml hot stock","1 small bunch parsley"],
   "recipeInstructions":[
     {"@type":"HowToSection","name":"Couscous","itemListElement":[
       {"@type":"HowToStep","text":"Put the couscous in a bowl and zest the lemons over it."},
       {"@type":"HowToStep","text":"Pour over the stock, cover and leave for 5-10 minutes until the liquid is absorbed."}]},
     {"@type":"HowToStep","text":"Fry the parsley in the oil over medium-high heat for 1 minute, then fold through."}]}
]}</script></head><body></body></html>`;

describe("extractRecipe", () => {
  const r = extractRecipe(page, "https://www.example.com/recipes/couscous")!;

  it("finds the Recipe inside @graph and cleans text", () => {
    expect(r.title).toBe("Lemon & Herb Couscous");
    expect(r.summary).toBe("A quick side.");
    expect(r.author).toBe("Sam Cook");
    expect(r.serves).toBe(4);
    expect(r.sourceName).toBe("Test Kitchen");
  });

  it("flattens sections into ordered steps", () => {
    expect(r.steps).toHaveLength(3);
    expect(r.steps[2]).toMatch(/^Fry the parsley/);
  });

  it("returns null without a usable recipe", () => {
    expect(extractRecipe("<html></html>", "https://x.com")).toBeNull();
    expect(extractRecipe('<script type="application/ld+json">{bad json</script>', "https://x.com")).toBeNull();
    expect(extractRecipe('<script type="application/ld+json">{"@type":"Recipe","name":"No steps"}</script>', "https://x.com")).toBeNull();
  });

  it("ignores authors given only as a link", () => {
    const linked = page.replace('{"@type":"Person","name":"Sam Cook"}', '{"@id":"https://www.example.com/#org","url":"https://www.example.com"}');
    expect(extractRecipe(linked, "https://www.example.com/r")!.author).toBeUndefined();
    const named = page.replace('{"@type":"Person","name":"Sam Cook"}', '[{"name":"Alex Chef"}]');
    expect(extractRecipe(named, "https://www.example.com/r")!.author).toBe("Alex Chef");
  });

  it("falls back to the hostname for the source", () => {
    const bare = page.replace(/<meta[^>]+>/, "");
    expect(extractRecipe(bare, "https://www.example.com/r")!.sourceName).toBe("example.com");
  });
});

describe("parseIngredient", () => {
  it("parses quantities, units, fractions and prep", () => {
    expect(parseIngredient("200g couscous", 0)).toMatchObject({ quantity: 200, unit: "g", name: "couscous" });
    expect(parseIngredient("1½ tbsp olive oil", 1)).toMatchObject({ quantity: 1.5, unit: "tbsp", name: "olive oil" });
    expect(parseIngredient("2 lemons, zested", 2)).toMatchObject({ quantity: 2, unit: "pc", name: "lemons", prep: "zested" });
    expect(parseIngredient("1.5kg potatoes", 3)).toMatchObject({ quantity: 1500, unit: "g" });
    expect(parseIngredient("1/2 tsp salt", 4)).toMatchObject({ quantity: 0.5, unit: "tsp" });
    expect(parseIngredient("2 cloves garlic", 5)).toMatchObject({ quantity: 2, unit: "pc", name: "cloves garlic" });
  });

  it("keeps the raw line when it can't parse", () => {
    expect(parseIngredient("Salt and pepper", 0)).toMatchObject({ quantity: 0, raw: "Salt and pepper", name: "Salt and pepper" });
  });
});

describe("stepToBlock", () => {
  it("reads times, taking the top of a range", () => {
    expect(stepMinutes("leave for 5-10 minutes")).toBe(10);
    expect(stepMinutes("roast for 1 hour")).toBe(60);
    expect(stepMinutes("blitz for 30 seconds")).toBe(0.5);
    expect(stepMinutes("chop the onion")).toBeNull();
    expect(stepMinutes("cook until fragrant, 1 to 2 minutes, then boil for 5 minutes")).toBe(7);
  });

  it("classifies hands-off, heat and prep steps with cues and jargon", () => {
    const rest = stepToBlock("Pour over the stock, cover and leave for 5-10 minutes until the liquid is absorbed.", 1);
    expect(rest).toMatchObject({ kind: "timing", attention: "passive", minutes: 10, cue: "the liquid is absorbed" });

    const fry = stepToBlock("Fry the parsley in the oil over medium-high heat for 1 minute, then fold through.", 2);
    expect(fry).toMatchObject({ kind: "heat", heat: "medium-high", attention: "active", minutes: 1 });
    expect(fry.terms?.fold).toBeDefined();

    expect(stepToBlock("Roast in the oven for 3 minutes.", 0)).toMatchObject({ kind: "heat", vessel: "oven" });
    expect(stepToBlock("Zest the lemons over the bowl.", 0)).toMatchObject({ kind: "prep", attention: "active" });
    expect(stepToBlock("Heat the oil in a wok and stir-fry.", 0)).toMatchObject({ kind: "heat", vessel: "wok", heat: "medium" });
    expect(stepToBlock("Bring a pot of water to the boil.", 0)).toMatchObject({ kind: "heat", vessel: "pot", heat: "high" });
    expect(stepToBlock("Bring water to a boil and cook the pasta, about 9 minutes.", 0)).toMatchObject({ kind: "timing", attention: "passive", minutes: 9 });
  });
});

describe("toRecipe", () => {
  it("builds a private, credited recipe the skill engine can adapt", () => {
    const recipe = toRecipe(extractRecipe(page, "https://www.example.com/recipes/couscous")!, "abc123");
    expect(recipe.slug).toBe("my-abc123");
    expect(recipe.category).toBe("My imports");
    expect(recipe.source).toEqual({ url: "https://www.example.com/recipes/couscous", name: "Test Kitchen" });
    expect(recipe.image).toBe("https://img.example.com/couscous.jpg");
    const insecure = toRecipe({ ...extractRecipe(page, "https://www.example.com/r")!, image: "http://img.example.com/x.jpg" }, "x");
    expect(insecure.image).toBeUndefined();
    const beginner = adaptRecipe(recipe, "beginner");
    expect(beginner.steps).toHaveLength(3);
    // The step already names its heat, so beginners aren't told twice.
    expect(beginner.steps[2].instructions[0]).toMatch(/^Fry the parsley in the oil over medium-high heat/);
  });
});

it("decodes entities", () => {
  expect(cleanText("Mac &amp; cheese &#8211; 200&deg;C &#x27;best&#x27;")).toBe("Mac & cheese – 200°C 'best'");
});

it("blocks private and local addresses", () => {
  for (const a of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "::ffff:127.0.0.1"]) {
    expect(isPrivateAddress(a), a).toBe(true);
  }
  for (const a of ["8.8.8.8", "151.101.1.1", "2606:4700::1111"]) expect(isPrivateAddress(a), a).toBe(false);
});
