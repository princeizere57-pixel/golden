import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWhopSignature, whopStatus } from "@/lib/billing/whop";

const secret = "ws_test_secret";
const body = '{"type":"membership.activated","data":{"id":"mem_1","status":"trialing"}}';
const now = 1_800_000_000;
const sign = (id: string, ts: number, b = body, key: Buffer | string = secret) =>
  `v1,${createHmac("sha256", key).update(`${id}.${ts}.${b}`).digest("base64")}`;

describe("verifyWhopSignature", () => {
  it("accepts a valid signature, including among several", () => {
    expect(verifyWhopSignature(body, { id: "msg_1", timestamp: String(now), signature: sign("msg_1", now) }, secret, now)).toBe(true);
    expect(verifyWhopSignature(body, { id: "msg_1", timestamp: String(now), signature: `v1,AAAA ${sign("msg_1", now)}` }, secret, now)).toBe(true);
  });

  it("supports Standard Webhooks whsec_ secrets", () => {
    const raw = Buffer.from("raw-key-bytes");
    const whsec = `whsec_${raw.toString("base64")}`;
    expect(verifyWhopSignature(body, { id: "m", timestamp: String(now), signature: sign("m", now, body, raw) }, whsec, now)).toBe(true);
  });

  it("rejects tampering, wrong secrets, stale timestamps and missing headers", () => {
    const signature = sign("msg_1", now);
    expect(verifyWhopSignature(body + " ", { id: "msg_1", timestamp: String(now), signature }, secret, now)).toBe(false);
    expect(verifyWhopSignature(body, { id: "msg_2", timestamp: String(now), signature }, secret, now)).toBe(false);
    expect(verifyWhopSignature(body, { id: "msg_1", timestamp: String(now), signature }, "ws_other", now)).toBe(false);
    expect(verifyWhopSignature(body, { id: "msg_1", timestamp: String(now - 301), signature: sign("msg_1", now - 301) }, secret, now)).toBe(false);
    expect(verifyWhopSignature(body, { id: null, timestamp: String(now), signature }, secret, now)).toBe(false);
    expect(verifyWhopSignature(body, { id: "msg_1", timestamp: String(now), signature: "v2,xyz" }, secret, now)).toBe(false);
  });
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

