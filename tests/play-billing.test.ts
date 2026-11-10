import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  acknowledgePlaySubscription,
  getPlaySubscription,
  judgePlaySubscription,
  playExpiry,
  playStateToStatus,
  resetPlayTokenCache,
  serviceAccountJwt,
  type PlaySubscription,
} from "@/lib/billing/google-play-api";
import { OFFERS } from "@/lib/billing/offers";
import { PLAY_PRODUCTS, describePlayOffer, offerForPlayProduct, periodLabel, pickPlayOffer, playProductFor, type PlayOffer } from "@/lib/billing/play-products";
import { ENTITLED } from "@/lib/billing/subscriptions";

const phase = (price: string, micros: number, period: string, recurrenceMode: number) => ({ formattedPrice: price, priceAmountMicros: micros, priceCurrencyCode: "USD", billingPeriod: period, recurrenceMode, billingCycleCount: recurrenceMode === 1 ? 0 : 1 });
const base: PlayOffer = { basePlanId: "yearly", offerId: null, offerToken: "base-token", phases: [phase("$100.00", 100_000_000, "P1Y", 1)] };
const trial: PlayOffer = { basePlanId: "yearly", offerId: "trial-3d", offerToken: "trial-token", phases: [phase("Free", 0, "P3D", 3), phase("$100.00", 100_000_000, "P1Y", 1)] };

describe("Play products", () => {
  it("has one Play subscription per Golden offer", () => {
    expect(PLAY_PRODUCTS.map((p) => p.offer).sort()).toEqual(OFFERS.map((o) => o.id).sort());
    expect(playProductFor("executive")?.productId).toBe("golden_executive");
    expect(offerForPlayProduct("golden_experience")).toBe("experience");
    expect(offerForPlayProduct("nope")).toBeUndefined();
  });

  it("picks the free-trial offer when Play offers one, otherwise the base plan", () => {
    expect(pickPlayOffer({ productId: "golden_executive", offers: [base, trial] }, "yearly")?.offerToken).toBe("trial-token");
    expect(pickPlayOffer({ productId: "golden_executive", offers: [base] }, "yearly")?.offerToken).toBe("base-token");
    expect(pickPlayOffer({ productId: "golden_executive", offers: [base] }, "monthly")).toBeUndefined();
  });

  it("describes Play's own prices", () => {
    expect(describePlayOffer(trial)).toBe("3 days free, then $100.00/year");
    expect(describePlayOffer(base)).toBe("$100.00/year");
    expect(periodLabel("P1W")).toBe("1 week");
    expect(periodLabel("P2M", true)).toBe("2 months");
  });
});

describe("Play subscription state", () => {
  const sub = (state: string, extra: Partial<PlaySubscription> = {}): PlaySubscription => ({
    subscriptionState: state,
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
    lineItems: [{ productId: "golden_executive", expiryTime: "2027-11-10T10:00:00Z" }],
    externalAccountIdentifiers: { obfuscatedExternalAccountId: "user-1" },
    ...extra,
  });

  it("maps every state, granting nothing while payment is pending", () => {
    expect(playStateToStatus("SUBSCRIPTION_STATE_ACTIVE")).toBe("active");
    expect(playStateToStatus("SUBSCRIPTION_STATE_IN_GRACE_PERIOD")).toBe("grace");
    expect(playStateToStatus("SUBSCRIPTION_STATE_ON_HOLD")).toBe("past_due");
    expect(playStateToStatus("SUBSCRIPTION_STATE_CANCELED")).toBe("canceled");
    expect(playStateToStatus("SUBSCRIPTION_STATE_EXPIRED")).toBe("expired");
    expect(playStateToStatus("SUBSCRIPTION_STATE_PENDING")).toBeNull();
  });

  it("grants an active purchase to its owner and asks for an acknowledgement", () => {
    expect(judgePlaySubscription(sub("SUBSCRIPTION_STATE_ACTIVE"), { userId: "user-1", productId: "golden_executive" }, ENTITLED)).toEqual({
      ok: true, status: "active", entitled: true, needsAck: true, expiry: "2027-11-10T10:00:00Z",
    });
    expect(judgePlaySubscription(sub("SUBSCRIPTION_STATE_EXPIRED", { acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED" }), { userId: "user-1", productId: "golden_executive" }, ENTITLED)).toMatchObject({ ok: true, entitled: false, needsAck: false });
  });

  it("refuses someone else's purchase, the wrong plan and pending payments", () => {
    expect(judgePlaySubscription(sub("SUBSCRIPTION_STATE_ACTIVE"), { userId: "user-2", productId: "golden_executive" }, ENTITLED).ok).toBe(false);
    expect(judgePlaySubscription(sub("SUBSCRIPTION_STATE_ACTIVE"), { userId: "user-1", productId: "golden_experience" }, ENTITLED).ok).toBe(false);
    expect(judgePlaySubscription(sub("SUBSCRIPTION_STATE_PENDING"), { userId: "user-1", productId: "golden_executive" }, ENTITLED).ok).toBe(false);
  });

  it("uses the latest expiry", () => {
    expect(playExpiry({ subscriptionState: "x", lineItems: [{ productId: "a", expiryTime: "2027-01-01T00:00:00Z" }, { productId: "b", expiryTime: "2027-06-01T00:00:00Z" }] })).toBe("2027-06-01T00:00:00Z");
  });
});

describe("Google Play Developer API", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

  afterEach(() => {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    resetPlayTokenCache();
  });

  it("signs a service-account JWT Google can verify", () => {
    const jwt = serviceAccountJwt({ client_email: "golden@project.iam.gserviceaccount.com", private_key: pem }, 1_800_000_000);
    const [h, c, sig] = jwt.split(".");
    expect(JSON.parse(Buffer.from(c, "base64url").toString())).toMatchObject({ iss: "golden@project.iam.gserviceaccount.com", scope: "https://www.googleapis.com/auth/androidpublisher", iat: 1_800_000_000, exp: 1_800_003_600 });
    expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(sig, "base64url"))).toBe(true);
  });

  it("fetches a subscription and acknowledges it with one access token", async () => {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "golden@project.iam.gserviceaccount.com", private_key: pem });
    const calls: string[] = [];
    const fake = (async (url: string | URL, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (String(url).startsWith("https://oauth2.googleapis.com/token")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      if (String(url).includes("subscriptionsv2")) return new Response(JSON.stringify({ subscriptionState: "SUBSCRIPTION_STATE_ACTIVE" }));
      return new Response("{}");
    }) as typeof fetch;
    expect((await getPlaySubscription("token-123", fake)).subscriptionState).toBe("SUBSCRIPTION_STATE_ACTIVE");
    await acknowledgePlaySubscription("golden_executive", "token-123", fake);
    expect(calls).toEqual([
      "POST https://oauth2.googleapis.com/token",
      "GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.golden.cooking/purchases/subscriptionsv2/tokens/token-123",
      "POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.golden.cooking/purchases/subscriptions/golden_executive/tokens/token-123:acknowledge",
    ]);
  });
});
