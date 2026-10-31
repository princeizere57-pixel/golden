import { afterEach, describe, expect, it } from "vitest";
import { sendMagicLink } from "@/lib/auth";
import { isJourneyPath } from "@/lib/journey";

describe("first-run gate", () => {
  it("always allows the sequence, API and assets", () => {
    for (const p of ["/welcome", "/signin", "/auth/callback", "/onboarding", "/checkout", "/api/billing/whop/webhook", "/_next/static/x.js", "/favicon.ico"]) {
      expect(isJourneyPath(p), p).toBe(true);
    }
  });

  it("gates the app itself", () => {
    for (const p of ["/", "/explore", "/for-you", "/plan", "/recipes/fluffy-rice", "/you", "/welcomeback"]) {
      expect(isJourneyPath(p), p).toBe(false);
    }
  });
});

describe("email magic link", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("asks Supabase to email a link back to /auth/callback", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    let seen: { url: string; body: string } | undefined;
    const fake = (async (url: string, init: RequestInit) => {
      seen = { url, body: String(init.body) };
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await sendMagicLink("cook@example.com", "http://localhost:3000", fake)).toBe(true);
    expect(seen?.url).toBe("https://proj.supabase.co/auth/v1/otp?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback");
    expect(JSON.parse(seen!.body)).toEqual({ email: "cook@example.com", create_user: true });
  });

  it("refuses bad emails, odd origins and missing config", async () => {
    const ok = (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
    expect(await sendMagicLink("cook@example.com", "http://localhost:3000", ok)).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    expect(await sendMagicLink("not-an-email", "http://localhost:3000", ok)).toBe(false);
    expect(await sendMagicLink("cook@example.com", "http://evil.com/path", ok)).toBe(false);
  });
});
