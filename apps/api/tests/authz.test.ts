import { beforeAll, describe, expect, it } from "vitest";

// Every route that reads or writes someone's data must refuse a caller without a session.
// No network: without a session cookie the session check answers before touching the database.
let app: { request: (path: string, init?: RequestInit) => Response | Promise<Response> };

beforeAll(async () => {
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost.invalid/db";
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  app = (await import("../src/app.js")).default;
});

const json = (method: string, body: unknown = {}) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const SIGNED_IN_ONLY: Array<[string, RequestInit?]> = [
  ["/profile"],
  ["/profile", json("PUT")],
  ["/sync"],
  ["/lists/saved", json("PUT", [])],
  ["/progress/events", json("POST")],
  ["/progress/seed", json("POST")],
  ["/community/posts"],
  ["/community/posts", json("POST")],
  ["/community/posts/00000000-0000-0000-0000-000000000000/replies", json("POST")],
  ["/billing/access"],
  ["/billing/checkout", json("POST")],
  ["/billing/checkout/hosted", json("POST")],
  ["/billing/play/verify", json("POST")],
  ["/ai/adapt", json("POST")],
  ["/ai/fix-tip", json("POST")],
  ["/ai/diagnose", json("POST")],
];

describe("authorisation", () => {
  it.each(SIGNED_IN_ONLY)("%s refuses a caller without a session", async (path, init) => {
    expect((await app.request(path, init)).status).toBe(401);
  });

  it("webhooks refuse unsigned or untokened calls", async () => {
    for (const path of ["/billing/whop/webhook", "/billing/google/rtdn", "/billing/app-store/notifications"]) {
      const status = (await app.request(path, json("POST", { type: "membership.activated" }))).status;
      expect([400, 401, 503]).toContain(status);
    }
  });

  it("the nightly sync job needs the cron secret", async () => {
    expect((await app.request("/cron/mealdb")).status).toBe(403);
  });
});
