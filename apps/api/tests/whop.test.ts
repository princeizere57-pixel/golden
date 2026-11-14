import { createHmac } from "node:crypto";
import { unwrapWebhook } from "@whop/sdk/helpers";
import { describe, expect, it, vi } from "vitest";
import { handleWhopEvent, whopStatus, type WhopStore } from "../src/services/billing/whop.js";

const USER = "Xq9mZ2kPLr4tBv7sNw1cYd8e";

// Whop HMACs `${id}.${timestamp}.${body}` with the literal bytes of the secret it issued.
const signed = (body: string, secret: string, id = "msg_1", ts = Math.floor(Date.now() / 1000)) => ({
  "webhook-id": id,
  "webhook-timestamp": String(ts),
  "webhook-signature": `v1,${createHmac("sha256", secret).update(`${id}.${ts}.${body}`).digest("base64")}`,
});

describe("Whop webhook signature (SDK check the API uses)", () => {
  const body = '{"type":"membership.activated","data":{"id":"mem_1","status":"trialing"}}';
  for (const secret of ["ws_test_secret", "whsec_dGVzdA=="]) {
    it(`accepts Whop's signature with a ${secret.slice(0, 5)}… secret and rejects tampering`, () => {
      expect(unwrapWebhook(body, { headers: signed(body, secret), key: secret })).toMatchObject({ type: "membership.activated" });
      expect(() => unwrapWebhook(body + " ", { headers: signed(body, secret), key: secret })).toThrow();
      expect(() => unwrapWebhook(body, { headers: signed(body, "ws_other"), key: secret })).toThrow();
      expect(() => unwrapWebhook(body, { headers: signed(body, secret, "msg_1", Math.floor(Date.now() / 1000) - 600), key: secret })).toThrow();
    });
  }
});

describe("whopStatus", () => {
  it("maps Whop membership statuses to ours", () => {
    expect(whopStatus({ status: "trialing" })).toBe("trialing");
    expect(whopStatus({ status: "active" })).toBe("active");
    expect(whopStatus({ status: "active", cancel_at_period_end: true })).toBe("canceled");
    expect(whopStatus({ status: "past_due" })).toBe("past_due");
    expect(whopStatus({ status: "unresolved" })).toBe("past_due");
    for (const s of ["completed", "canceled", "expired"]) expect(whopStatus({ status: s })).toBe("expired");
    expect(whopStatus({ status: "something-new" })).toBeNull();
  });
});

describe("handleWhopEvent", () => {
  const fakeStore = (known?: string) => ({
    saveSubscription: vi.fn(async () => {}),
    markOrderPaid: vi.fn(async () => {}),
    userForWhopUser: vi.fn(async () => known),
  }) satisfies WhopStore;

  it("saves a membership with our account, plan and period end", async () => {
    const db = fakeStore();
    await handleWhopEvent(
      { type: "membership.activated", data: { id: "mem_1", status: "trialing", user_id: "user_W", current_period_end: "2026-11-20T00:00:00Z", metadata: { golden_user_id: USER, offer: "experience" } } },
      db,
    );
    expect(db.saveSubscription).toHaveBeenCalledWith({ provider: "whop", externalId: "mem_1", status: "trialing", userId: USER, whopUserId: "user_W", currentPeriodEnd: "2026-11-20T00:00:00Z", offer: "experience" });
    expect(db.userForWhopUser).not.toHaveBeenCalled();
  });

  it("links a membership without metadata through a Whop user already tied to an account", async () => {
    const db = fakeStore(USER);
    await handleWhopEvent({ type: "membership.updated", data: { id: "mem_2", status: "active", user_id: "user_W" } }, db);
    expect(db.userForWhopUser).toHaveBeenCalledWith("user_W");
    expect(db.saveSubscription).toHaveBeenCalledWith(expect.objectContaining({ externalId: "mem_2", status: "active", userId: USER }));
  });

  it("keeps an unknown buyer's membership unlinked and ignores bad account ids", async () => {
    const db = fakeStore();
    await handleWhopEvent({ type: "membership.activated", data: { id: "mem_3", status: "active", user_id: "user_Z", metadata: { golden_user_id: "x' or 1=1" } } }, db);
    expect(db.saveSubscription).toHaveBeenCalledWith(expect.objectContaining({ externalId: "mem_3", userId: undefined, whopUserId: "user_Z" }));
  });

  it("marks the order paid on payment.succeeded; subscriptions come from membership events", async () => {
    const db = fakeStore();
    await handleWhopEvent({ type: "payment.succeeded", data: { id: "pay_1", user_id: "user_W", metadata: { order_id: "gld_abc_0123456789ab", golden_user_id: USER, offer: "executive" } } }, db);
    expect(db.markOrderPaid).toHaveBeenCalledWith({ order_id: "gld_abc_0123456789ab", golden_user_id: USER, offer: "executive" }, "pay_1");
    expect(db.saveSubscription).not.toHaveBeenCalled();
  });

  it("ignores unknown statuses and other event types", async () => {
    const db = fakeStore();
    await handleWhopEvent({ type: "membership.updated", data: { id: "mem_4", status: "something-new" } }, db);
    await handleWhopEvent({ type: "refund.created", data: { id: "r_1" } }, db);
    expect(db.saveSubscription).not.toHaveBeenCalled();
    expect(db.markOrderPaid).not.toHaveBeenCalled();
  });
});
