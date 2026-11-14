import { describe, expect, it } from "vitest";
import { entitledFrom } from "@/lib/billing/entitlements";

const NOW = Date.parse("2026-11-10T12:00:00Z");

describe("Premium from paid subscriptions", () => {
  it("grants active, trialing and grace, and cancelled only until the paid period ends", () => {
    expect(entitledFrom([{ status: "active", current_period_end: null }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "trialing", current_period_end: null }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "grace", current_period_end: null }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "canceled", current_period_end: "2026-12-01T00:00:00Z" }], NOW)).toBe(true);
    expect(entitledFrom([{ status: "canceled", current_period_end: "2026-11-01T00:00:00Z" }], NOW)).toBe(false);
    expect(entitledFrom([{ status: "expired", current_period_end: null }, { status: "revoked", current_period_end: null }], NOW)).toBe(false);
    expect(entitledFrom([], NOW)).toBe(false);
  });
});
