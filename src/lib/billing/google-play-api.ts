// Google Play Developer API (androidpublisher v3), server-only. Confirms a subscription with Google
// before Golden grants anything, and acknowledges new purchases (Play refunds purchases that
// aren't acknowledged within 3 days).
//
// Auth: a Google Cloud service account with access to the app in the Play Console
// (Users and permissions → "View financial data" + "Manage orders and subscriptions"), its JSON key
// in GOOGLE_PLAY_SERVICE_ACCOUNT_JSON. The key signs a short-lived JWT exchanged for an access token.

import { createSign } from "node:crypto";
import type { SubscriptionStatus } from "@/lib/billing/subscriptions";

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

export const playPackageName = () => process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.golden.cooking";

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

export const playApiConfigured = () => serviceAccount() !== null;

const b64url = (data: string | Buffer) => Buffer.from(data).toString("base64url");

/** A signed RS256 JWT asking for an androidpublisher access token. */
export function serviceAccountJwt(sa: ServiceAccount, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri ?? "https://oauth2.googleapis.com/token", iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key);
  return `${header}.${claims}.${b64url(signature)}`;
}

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(fetchImpl: typeof fetch): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const sa = serviceAccount();
  if (!sa) throw new Error("Google Play API isn't configured (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON).");
  const res = await fetchImpl(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: serviceAccountJwt(sa) }),
  });
  if (!res.ok) throw new Error(`Google token request failed: ${res.status}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

/** Test hook: forget the cached access token. */
export const resetPlayTokenCache = () => {
  cached = null;
};

/** The parts of SubscriptionPurchaseV2 Golden uses. */
export interface PlaySubscription {
  subscriptionState: string;
  acknowledgementState?: string;
  linkedPurchaseToken?: string;
  testPurchase?: object;
  lineItems?: { productId: string; expiryTime?: string; offerDetails?: { basePlanId?: string; offerId?: string } }[];
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
}

export async function getPlaySubscription(purchaseToken: string, fetchImpl: typeof fetch = fetch): Promise<PlaySubscription> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(`${API}/${playPackageName()}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Play subscription lookup failed: ${res.status}`);
  return (await res.json()) as PlaySubscription;
}

export async function acknowledgePlaySubscription(productId: string, purchaseToken: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(
    `${API}/${playPackageName()}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" },
  );
  // 400 "already acknowledged" is fine; anything else is worth knowing about.
  if (!res.ok && res.status !== 400) throw new Error(`Google Play acknowledge failed: ${res.status}`);
}

/** SubscriptionPurchaseV2.subscriptionState → Golden's status (null = don't record yet). */
export function playStateToStatus(state: string): SubscriptionStatus | null {
  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return "active";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "grace";
    case "SUBSCRIPTION_STATE_ON_HOLD":
      return "past_due";
    case "SUBSCRIPTION_STATE_PAUSED":
      return "paused";
    case "SUBSCRIPTION_STATE_CANCELED":
      // Cancelled but paid up: access continues until the expiry time.
      return "canceled";
    case "SUBSCRIPTION_STATE_EXPIRED":
    case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
      return "expired";
    default:
      // SUBSCRIPTION_STATE_PENDING (payment still processing) and unknown states grant nothing.
      return null;
  }
}

/** Latest expiry across line items, ISO 8601. */
export const playExpiry = (sub: PlaySubscription) =>
  sub.lineItems?.map((l) => l.expiryTime).filter((t): t is string => Boolean(t)).sort().at(-1);

export type PlayVerdict =
  | { ok: true; status: SubscriptionStatus; entitled: boolean; needsAck: boolean; expiry?: string }
  | { ok: false; reason: string };

/**
 * Decides what a Play subscription means for this Golden user. Refuses purchases for another
 * product or made under another account, and anything still pending.
 */
export function judgePlaySubscription(sub: PlaySubscription, expect: { userId: string; productId: string }, entitled: SubscriptionStatus[]): PlayVerdict {
  if (!sub.lineItems?.some((l) => l.productId === expect.productId)) return { ok: false, reason: "That purchase is for a different plan." };
  const owner = sub.externalAccountIdentifiers?.obfuscatedExternalAccountId;
  if (owner && owner !== expect.userId) return { ok: false, reason: "That purchase belongs to a different Golden account." };
  const status = playStateToStatus(sub.subscriptionState);
  if (!status) return { ok: false, reason: "Google Play is still processing the payment. Try again in a minute." };
  return {
    ok: true,
    status,
    entitled: entitled.includes(status),
    needsAck: sub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING",
    expiry: playExpiry(sub),
  };
}
