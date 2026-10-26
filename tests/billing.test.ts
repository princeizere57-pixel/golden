import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { JwsError, appStoreStatus, verifyAppleJws } from "@/lib/billing/app-store";
import { decodeRtdn, playStatus } from "@/lib/billing/google-play";
import { ENTITIES, PRICES, annualSavingPercent, estimateNet, formatMoney, priceFor, routeEntity } from "@/lib/billing/routing";
import { createCheckoutSession, verifyStripeSignature } from "@/lib/billing/stripe";

describe("routing", () => {
  it("sends GB to the UK entity and everyone else to the US entity", () => {
    expect(routeEntity("GB").entity).toBe("uk");
    expect(routeEntity(" gb ").entity).toBe("uk");
    expect(routeEntity("US").entity).toBe("us");
    expect(routeEntity("FR").entity).toBe("us");
    expect(routeEntity(null).entity).toBe("us");
  });

  it("prices $45/year and $7.99/month, with GBP set separately", () => {
    expect(priceFor("US", "year").price).toEqual({ interval: "year", currency: "usd", amount: 4500 });
    expect(priceFor("US", "month").price.amount).toBe(799);
    expect(priceFor("GB", "year").price.currency).toBe("gbp");
    expect(formatMoney(PRICES.usd.year)).toBe("$45.00");
    expect(annualSavingPercent("usd")).toBe(53);
  });

  it("estimates fees per channel", () => {
    expect(estimateNet(PRICES.usd.year, "web")).toEqual({ gross: 4500, fee: 161, net: 4339 });
    expect(estimateNet(PRICES.gbp.year, "web", ENTITIES.uk)).toEqual({ gross: 3999, fee: 80, net: 3919 });
    expect(estimateNet(PRICES.usd.year, "app_store").fee).toBe(675);
  });
});

describe("Stripe", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const sign = (t: number, body = payload) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

  it("accepts a valid signature and rejects tampering, staleness and junk", () => {
    const now = 1_800_000_000;
    expect(verifyStripeSignature(payload, sign(now), secret, 300, now)).toBe(true);
    expect(verifyStripeSignature('{"id":"evt_2"}', sign(now), secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(payload, sign(now - 301), secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(payload, sign(now), "whsec_other", 300, now)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret)).toBe(false);
    expect(verifyStripeSignature(payload, "garbage", secret)).toBe(false);
  });

  it("creates a checkout session with a 7-day trial on the routed entity's key", async () => {
    process.env.STRIPE_UK_SECRET_KEY = "sk_test_uk";
    let seen: { url: string; init: RequestInit } | undefined;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ url: "https://checkout.stripe.test/s" }), { status: 200 });
    }) as unknown as typeof fetch;
    const url = await createCheckoutSession(
      { entity: "uk", priceId: "price_1", userId: "u1", successUrl: "https://x/ok", cancelUrl: "https://x/no" },
      fakeFetch,
    );
    expect(url).toBe("https://checkout.stripe.test/s");
    const body = new URLSearchParams(String(seen!.init.body));
    expect(body.get("subscription_data[trial_period_days]")).toBe("7");
    expect(body.get("mode")).toBe("subscription");
    expect((seen!.init.headers as Record<string, string>).Authorization).toBe("Bearer sk_test_uk");
    delete process.env.STRIPE_UK_SECRET_KEY;
  });

  it("refuses to run without a key", async () => {
    await expect(createCheckoutSession({ entity: "us", priceId: "p", userId: "u", successUrl: "", cancelUrl: "" })).rejects.toThrow(/not configured/);
  });
});

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
