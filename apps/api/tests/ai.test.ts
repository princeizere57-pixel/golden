import { RECIPES, adaptRecipe } from "@golden/shared";
import { afterEach, describe, expect, it } from "vitest";
import { adaptWithAi, diagnosePhoto, generateJson } from "../src/services/ai.js";

const reply = (text: string, status = 200, seen: unknown[] = []) =>
  (async (_url: string, init: RequestInit) => {
    seen.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status });
  }) as unknown as typeof fetch;

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
});

describe("generateJson", () => {
  it("returns null without a key, so callers fall back", async () => {
    expect(await generateJson([{ text: "hi" }], { fetchImpl: reply('{"a":1}') })).toBeNull();
  });

  it("parses the JSON answer", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await generateJson([{ text: "hi" }], { fetchImpl: reply('{"a":1}') })).toEqual({ a: 1 });
  });

  it("returns null on HTTP errors, bad JSON and network failures", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await generateJson([{ text: "hi" }], { fetchImpl: reply("{}", 500) })).toBeNull();
    expect(await generateJson([{ text: "hi" }], { fetchImpl: reply("not json") })).toBeNull();
    const boom = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await generateJson([{ text: "hi" }], { fetchImpl: boom })).toBeNull();
  });
});

describe("adaptWithAi", () => {
  const recipe = RECIPES[0];

  it("keeps timings from the recipe and only takes the wording", async () => {
    process.env.GEMINI_API_KEY = "test";
    const steps = recipe.blocks.map((_, i) => ({ instructions: [`Step ${i} rewritten.`], notes: [] }));
    const out = await adaptWithAi(recipe, "chef", reply(JSON.stringify({ steps })));
    const engine = adaptRecipe(recipe, "chef");
    expect(out?.source).toBe("ai");
    expect(out?.steps.map((s) => s.minutes)).toEqual(engine.steps.map((s) => s.minutes));
    expect(out?.steps[0].instructions).toEqual(["Step 0 rewritten."]);
  });

  it("rejects an answer with the wrong number of steps", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await adaptWithAi(recipe, "chef", reply('{"steps":[{"instructions":["x"]}]}'))).toBeNull();
  });
});

describe("diagnosePhoto", () => {
  const photo = "data:image/jpeg;base64,AAAA";

  it("says no-ai without a key", async () => {
    expect(await diagnosePhoto(photo, "Risotto", reply("{}"))).toEqual({ ok: false, reason: "no-ai" });
  });

  it("refuses anything that isn't an image data URL", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await diagnosePhoto("https://example.com/x.jpg", "Risotto", reply("{}"))).toEqual({ ok: false, reason: "failed" });
  });

  it("sends the photo inline and maps the answer onto our catalogue", async () => {
    process.env.GEMINI_API_KEY = "test";
    const seen: Array<{ contents: Array<{ parts: Array<{ inlineData?: { mimeType: string; data: string } }> }> }> = [];
    const out = await diagnosePhoto(photo, "Risotto", reply('{"mistake":"too-salty","note":"Looks fine, tastes salty."}', 200, seen));
    expect(out).toEqual({ ok: true, mistake: "too-salty", note: "Looks fine, tastes salty." });
    expect(seen[0].contents[0].parts[0].inlineData).toEqual({ mimeType: "image/jpeg", data: "AAAA" });
  });

  it("says unclear when the answer isn't one of our mistakes", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await diagnosePhoto(photo, "Risotto", reply('{"mistake":"unclear","note":""}'))).toEqual({ ok: false, reason: "unclear" });
  });
});
