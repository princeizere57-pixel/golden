import { describe, expect, it } from "vitest";
import { JwsError, appStoreStatus, verifyAppleJws } from "../src/services/billing/app-store.js";
import { decodeRtdn, playStatus } from "../src/services/billing/google-play-rtdn.js";

describe("App Store", () => {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

  it("rejects malformed tokens, other algorithms and missing chains", () => {
    expect(() => verifyAppleJws("a.b")).toThrow(JwsError);
    expect(() => verifyAppleJws(`${b64({ alg: "HS256" })}.${b64({})}.sig`)).toThrow(/algorithm/);
    expect(() => verifyAppleJws(`${b64({ alg: "ES256", x5c: [] })}.${b64({})}.sig`)).toThrow(/chain/);
  });

  it("maps notification types to statuses", () => {
    expect(appStoreStatus("SUBSCRIBED")).toBe("active");
    expect(appStoreStatus("DID_FAIL_TO_RENEW", "GRACE_PERIOD")).toBe("grace");
    expect(appStoreStatus("DID_CHANGE_RENEWAL_STATUS", "AUTO_RENEW_DISABLED")).toBe("canceled");
    expect(appStoreStatus("REFUND")).toBe("revoked");
    expect(appStoreStatus("TEST")).toBeNull();
  });
});

describe("Google Play", () => {
  it("decodes the Pub/Sub envelope and maps statuses", () => {
    const msg = { packageName: "com.beachef", eventTimeMillis: "1", subscriptionNotification: { notificationType: 4, purchaseToken: "tok" } };
    const decoded = decodeRtdn({ message: { data: Buffer.from(JSON.stringify(msg)).toString("base64") } });
    expect(decoded?.subscriptionNotification?.purchaseToken).toBe("tok");
    expect(decodeRtdn({ message: { data: "!!!" } })).toBeNull();
    expect(decodeRtdn(null)).toBeNull();
    expect(playStatus(4)).toBe("active");
    expect(playStatus(13)).toBe("expired");
    expect(playStatus(99)).toBeNull();
  });
});
