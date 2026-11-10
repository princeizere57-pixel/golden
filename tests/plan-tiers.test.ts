import { describe, expect, it } from "vitest";
import { bestTier, can, parseTier, planFor, type Feature } from "@/lib/billing/entitlements";
import { OFFERS } from "@/lib/billing/offers";
import { tierFrom } from "@/lib/billing/subscriptions";
import { shellFromUserAgent, storeFor } from "@/lib/native/user-agent";

const NOW = Date.parse("2026-11-10T12:00:00Z");

describe("what each plan unlocks", () => {
  it("free reads recipes only; Experience cooks one dish; Executive gets everything", () => {
    const all: Feature[] = ["cookMode", "singleDishPlan", "shoppingList", "community", "premiumRecipes", "multiDish", "fixMyMistake", "pantry", "modules", "recipeWriter"];
    expect(all.filter((f) => can("free", f))).toEqual([]);
    expect(all.filter((f) => can("experience", f))).toEqual(["cookMode", "singleDishPlan", "shoppingList", "community", "premiumRecipes"]);
    expect(all.every((f) => can("executive", f))).toBe(true);
  });

  it("matches what checkout promises: Experience's excluded features are locked to Executive", () => {
    const experience = OFFERS.find((o) => o.id === "experience")!;
    expect(experience.excludes).toEqual(expect.arrayContaining(["Multi-Dish Timing Orchestrator", "'Fix My Mistake' AI Doctor", "Pantry-to-Plate Matcher"]));
    for (const f of ["multiDish", "fixMyMistake", "pantry", "modules"] as Feature[]) expect(planFor(f)).toBe("executive");
    expect(planFor("cookMode")).toBe("experience");
  });

  it("reads plan values, treating older 'premium' as Executive", () => {
    expect(parseTier("premium")).toBe("executive");
    expect(parseTier("experience")).toBe("experience");
    expect(parseTier("free")).toBe("free");
    expect(parseTier(null)).toBe("free");
    expect(parseTier("hacker")).toBe("free");
    expect(bestTier(["experience", "executive", "free"])).toBe("executive");
    expect(bestTier([])).toBe("free");
  });

  it("takes the plan from live subscription rows", () => {
    expect(tierFrom([{ status: "trialing", current_period_end: null, offer: "experience" }], NOW)).toBe("experience");
    expect(tierFrom([{ status: "active", current_period_end: null }], NOW)).toBe("executive"); // row from before migration 0007
    expect(tierFrom([{ status: "active", current_period_end: null, offer: null }], NOW)).toBe("executive");
    expect(
      tierFrom(
        [
          { status: "expired", current_period_end: null, offer: "executive" },
          { status: "active", current_period_end: null, offer: "experience" },
        ],
        NOW,
      ),
    ).toBe("experience");
    expect(tierFrom([{ status: "canceled", current_period_end: "2026-11-01T00:00:00Z", offer: "executive" }], NOW)).toBe("free");
  });
});

describe("no web payment inside the store apps", () => {
  it("spots Golden's Android and iPhone apps from their user agent", () => {
    expect(shellFromUserAgent("Mozilla/5.0 (Linux; Android 14; wv) Chrome/130 Mobile GoldenApp/android")).toBe("android");
    expect(shellFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605 GoldenApp/ios")).toBe("ios");
    expect(shellFromUserAgent("Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile")).toBeNull();
    expect(shellFromUserAgent(undefined)).toBeNull();
  });

  it("pays with Google Play on Android, nothing on iPhone yet, Whop only on the web", () => {
    expect(storeFor("android")).toBe("google_play");
    expect(storeFor("ios")).toBe("none");
    expect(storeFor(null)).toBe("web");
  });
});
