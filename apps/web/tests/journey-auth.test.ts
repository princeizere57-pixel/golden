import { describe, expect, it } from "vitest";
import { isJourneyPath, journeyComplete } from "@/lib/journey";

describe("first-run gate", () => {
  it("always allows the sequence, API and assets", () => {
    for (const p of ["/welcome", "/signin", "/auth/callback", "/onboarding", "/checkout", "/api/billing/whop/webhook", "/api/auth/get-session", "/_next/static/x.js", "/favicon.ico"]) {
      expect(isJourneyPath(p), p).toBe(true);
    }
  });

  it("gates the app itself", () => {
    for (const p of ["/", "/explore", "/for-you", "/plan", "/recipes/fluffy-rice", "/you", "/welcomeback"]) {
      expect(isJourneyPath(p), p).toBe(false);
    }
  });
});

describe("journey complete", () => {
  const jar = (names: Record<string, string>) => ({ has: (n: string) => n in names, get: (n: string) => (n in names ? { value: names[n] } : undefined) });

  it("opens the app after sign-in and the questions, even without checkout", () => {
    expect(journeyComplete(jar({ "better-auth.session_token": "t", "bac-skill": "beginner" }))).toBe(true);
    // Production (https) cookie name.
    expect(journeyComplete(jar({ "__Secure-better-auth.session_token": "t", "bac-skill": "beginner" }))).toBe(true);
    expect(journeyComplete(jar({ "bac-journey": "done" }))).toBe(true);
  });

  it("keeps first-time visitors on the welcome sequence", () => {
    expect(journeyComplete(jar({}))).toBe(false);
    expect(journeyComplete(jar({ "better-auth.session_token": "t" }))).toBe(false);
    expect(journeyComplete(jar({ "bac-skill": "beginner" }))).toBe(false);
    // The old pre-Better-Auth cookie no longer opens the app.
    expect(journeyComplete(jar({ "bac-user": "{}", "bac-skill": "beginner" }))).toBe(false);
  });
});
