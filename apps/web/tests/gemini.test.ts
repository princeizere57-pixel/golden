import { afterEach, describe, expect, it } from "vitest";
import { generateJson } from "@/lib/ai/gemini";

const reply = (text: string, status = 200) =>
  (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status })) as unknown as typeof fetch;

describe("generateJson", () => {
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("returns null without a key, so callers fall back", async () => {
    expect(await generateJson("hi", { fetchImpl: reply('{"a":1}') })).toBeNull();
  });

  it("parses the JSON answer", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await generateJson("hi", { fetchImpl: reply('{"a":1}') })).toEqual({ a: 1 });
  });

  it("returns null on HTTP errors, bad JSON and network failures", async () => {
    process.env.GEMINI_API_KEY = "test";
    expect(await generateJson("hi", { fetchImpl: reply("{}", 500) })).toBeNull();
    expect(await generateJson("hi", { fetchImpl: reply("not json") })).toBeNull();
    const boom = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await generateJson("hi", { fetchImpl: boom })).toBeNull();
  });
});
