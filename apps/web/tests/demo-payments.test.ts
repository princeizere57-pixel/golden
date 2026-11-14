import { afterEach, describe, expect, it, vi } from "vitest";
import { demoPaymentsAllowed } from "@/lib/billing/demo";

describe("demo payments", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("are allowed in local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(demoPaymentsAllowed()).toBe(true);
  });

  it("are off in every production build (live site and previews), so nobody can give themselves a plan", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(demoPaymentsAllowed()).toBe(false);
  });
});
