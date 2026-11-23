import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";

const visit = (path: string) => middleware(new NextRequest(new URL(path, "https://golden.test")));

describe("Whop affiliate links", () => {
  it("keeps ?a=USERNAME for 30 days, even when the gate redirects", () => {
    const res = visit("/explore?a=chef_sam");
    expect(res.status).toBe(307);
    const cookie = res.cookies.get("bac-aff");
    expect(cookie?.value).toBe("chef_sam");
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30);
    expect(cookie?.httpOnly).toBe(true);
  });

  it("ignores anything that isn't a Whop username", () => {
    for (const bad of ["", "a b", "<script>", "x".repeat(41)]) {
      expect(visit(`/?a=${encodeURIComponent(bad)}`).cookies.get("bac-aff"), bad).toBeUndefined();
    }
  });
});
