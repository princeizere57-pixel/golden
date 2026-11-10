import { afterEach, describe, expect, it } from "vitest";
import { entitledFrom, hasActiveSubscription } from "@/lib/billing/subscriptions";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const USER = "0b6c1f2e-1111-4a2b-9c3d-123456789abc";

describe("Premium from paid subscriptions", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("grants active, trialing and grace, and cancelled only until the paid period ends", () => {
    expect(entitledFrom([{ status: "active", current_period_end: null }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "trialing", current_period_end: null }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "grace", current_period_end: null }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "canceled", current_period_end: "2026-12-01T00:00:00Z" }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "canceled", current_period_end: "2026-11-01T00:00:00Z" }], NOW)).toBe(false);
    expect(entitledFrom([{ status: "expired", current_period_end: null }, { status: "revoked", current_period_end: null }], NOW)).toBe(false);
    expect(entitledFrom([], NOW)).toBe(false);
  });

  it("reads the account's rows from Supabase, and says 'unknown' rather than guessing", async () => {
    expect(await hasActiveSubscription(USER)).toBeNull(); // not configured
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    let asked = "";
    const ok = (async (url: string | URL) => {
      asked = String(url);
      return new Response(JSON.stringify([{ status: "active", current_period_end: null }]));
    }) as typeof fetch;
    expect(await hasActiveSubscription(USER, ok)).toBe(true);
    expect(asked).toBe(`https://x.supabase.co/rest/v1/subscriptions?user_id=eq.${USER}&select=*`);
    expect(await hasActiveSubscription(USER, (async () => new Response("[]")) as typeof fetch)).toBe(false);
    expect(await hasActiveSubscription(USER, (async () => new Response("down", { status: 500 })) as typeof fetch)).toBeNull();
    expect(await hasActiveSubscription("demo-123", ok)).toBeNull(); // demo accounts aren't in the database
  });
});
