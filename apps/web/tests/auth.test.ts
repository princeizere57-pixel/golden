import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifySupabaseToken } from "@/lib/auth";

const reply = (status: number, body: unknown) =>
  (async (url: string, init: RequestInit) => {
    seen = { url, headers: init.headers as Record<string, string> };
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;

let seen: { url: string; headers: Record<string, string> } | undefined;

describe("verifySupabaseToken", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co/";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    seen = undefined;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("returns the Google user for a valid token", async () => {
    const user = await verifySupabaseToken("tok", reply(200, { id: "u1", email: "a@b.com", user_metadata: { full_name: "Ada Cook", avatar_url: "https://img/a.png" } }));
    expect(user).toEqual({ id: "u1", email: "a@b.com", name: "Ada Cook", avatarUrl: "https://img/a.png", provider: "google" });
    expect(seen?.url).toBe("https://proj.supabase.co/auth/v1/user");
    expect(seen?.headers.Authorization).toBe("Bearer tok");
  });

  it("falls back to the email name when Google gives no name", async () => {
    expect((await verifySupabaseToken("tok", reply(200, { id: "u1", email: "chef@x.com" })))?.name).toBe("chef");
  });

  it("rejects invalid tokens, missing fields and missing config", async () => {
    expect(await verifySupabaseToken("bad", reply(401, { msg: "invalid" }))).toBeNull();
    expect(await verifySupabaseToken("tok", reply(200, { id: "u1" }))).toBeNull();
    expect(await verifySupabaseToken("", reply(200, { id: "u1", email: "a@b.com" }))).toBeNull();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(await verifySupabaseToken("tok", reply(200, { id: "u1", email: "a@b.com" }))).toBeNull();
  });
});
