import { describe, expect, it } from "vitest";
import { syncDecision } from "@/lib/sync";
import { LIST_SCHEMAS, isListName, communityPostSchema } from "@/lib/types";

describe("syncDecision (whose data a device holds)", () => {
  it("adopts guest data, keeps the same account, wipes someone else's", () => {
    expect(syncDecision(null, "u1")).toBe("adopt");
    expect(syncDecision("u1", "u1")).toBe("same");
    expect(syncDecision("u2", "u1")).toBe("wipe");
  });
});

describe("list schemas (the server's limits)", () => {
  it("normalises the pantry like the device does", () => {
    expect(LIST_SCHEMAS.pantry.parse(["  Garlic ", "garlic", "", "x".repeat(50)])).toEqual(["garlic", "x".repeat(40)]);
  });

  it("keeps shopping ids (slug:index) and rejects external links", () => {
    expect(LIST_SCHEMAS.shopping.safeParse([{ id: "pasta:0", text: "200g pasta", recipeTitle: "Pasta", href: "/recipes/pasta", done: false }]).success).toBe(true);
    expect(LIST_SCHEMAS.shopping.safeParse([{ id: "pasta:0", text: "x", recipeTitle: "Pasta", href: "https://evil.com", done: false }]).success).toBe(false);
  });

  it("caps list sizes", () => {
    const saved = Array.from({ length: 501 }, (_, i) => ({ slug: `r${i}`, href: `/recipes/r${i}`, title: "R", minutes: 10 }));
    expect(LIST_SCHEMAS.saved.safeParse(saved).success).toBe(false);
    expect(LIST_SCHEMAS.timers.safeParse(Array.from({ length: 21 }, (_, i) => ({ id: `t${i}`, label: "Boil", recipeSlug: "pasta", endsAt: 1 }))).success).toBe(false);
  });

  it("only accepts private import slugs and external https photos", () => {
    const ok = { slug: "my-ab12cd34", title: "Soup", image: "https://site.com/soup.jpg", source: { url: "https://site.com/soup", name: "Site" }, blocks: [] };
    expect(LIST_SCHEMAS.imports.safeParse([ok]).success).toBe(true);
    expect(LIST_SCHEMAS.imports.safeParse([{ ...ok, slug: "garlic-butter-pasta" }]).success).toBe(false);
    expect(LIST_SCHEMAS.imports.safeParse([{ ...ok, image: "http://site.com/soup.jpg" }]).success).toBe(false);
    // The full recipe is kept, not trimmed to the checked fields.
    expect(LIST_SCHEMAS.imports.parse([ok])[0]).toHaveProperty("blocks");
  });

  it("knows its list names", () => {
    expect(isListName("saved")).toBe(true);
    expect(isListName("toString")).toBe(false);
  });
});

describe("community post schema", () => {
  it("collapses whitespace, cuts to length and needs two characters", () => {
    expect(communityPostSchema.parse({ dish: "  Risotto   night ", note: "ok" })).toEqual({ dish: "Risotto night", note: "ok", asksForHelp: false });
    expect(communityPostSchema.safeParse({ dish: " a ", note: "ok" }).success).toBe(false);
    expect(communityPostSchema.parse({ dish: "x".repeat(200), note: "ok" }).dish).toHaveLength(80);
  });
});
