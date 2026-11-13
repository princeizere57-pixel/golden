import { afterEach, describe, expect, it, vi } from "vitest";
import { demoPaymentsAllowed } from "@/lib/billing/demo";

describe("demo payments", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("are allowed only without real accounts or Stripe", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("STRIPE_US_SECRET_KEY", "");
    vi.stubEnv("STRIPE_UK_SECRET_KEY", "");
    expect(demoPaymentsAllowed()).toBe(true);
  });

  it("are off on the live site (Supabase configured), so nobody can give themselves a plan", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("STRIPE_US_SECRET_KEY", "");
    vi.stubEnv("STRIPE_UK_SECRET_KEY", "");
    expect(demoPaymentsAllowed()).toBe(false);
  });
});
