import { timingSafeEqual } from "node:crypto";
import { ENTITLED, OFFERS, isAffiliateCode, newOrderId, offerById, offerForPlayProduct, type GoldenMetadata } from "@golden/shared/billing";
import { unwrapWebhook } from "@whop/sdk/helpers";
import { Hono, type Context } from "hono";
import { env } from "../env.js";
import { requireUserId } from "../session.js";
import { JwsError, appStoreStatus, verifyAppleJws } from "../services/billing/app-store.js";
import { decodeRtdn, playStatus as rtdnStatus } from "../services/billing/google-play-rtdn.js";
import { acknowledgePlaySubscription, getPlaySubscription, judgePlaySubscription, playApiConfigured, playExpiry, playPackageName, playStatus } from "../services/billing/google-play.js";
import { accessForUser, createOrder, saveSubscription, spotsTaken, type SubscriptionUpdate } from "../services/billing/store.js";
import { rateLimit } from "../services/rate-limit.js";
import { USER_ID, handleWhopEvent, prepareWhopCheckout, whopApiConfigured, whopEmbedConfigured, type WhopEvent } from "../services/billing/whop.js";

// Public URLs are unchanged: the web proxies /api/billing/* here with the /api prefix stripped,
// so the webhook addresses registered with Whop, Google and Apple keep working.
export const billing = new Hono();

const ORIGIN = /^https?:\/\/[^/]+$/;
const ORDER_ID = /^gld_[a-z0-9]+_[0-9a-f]{12}$/;
const REFERRAL = /^[A-Z0-9]{6,12}$/;
const sameSecret = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** What the signed-in account can use right now. */
billing.get("/billing/access", async (c) => {
  const access = await accessForUser(await requireUserId(c));
  c.header("Cache-Control", "no-store");
  return c.json(access);
});

/** Checkout page facts: real founding spots taken, and which Whop options are configured. */
billing.get("/billing/checkout", async (c) =>
  c.json({ spotsTaken: await spotsTaken(), payLater: whopApiConfigured(), embed: Object.fromEntries(OFFERS.map((o) => [o.id, whopEmbedConfigured(o)])) }),
);

type CheckoutBody = { offerId?: unknown; orderId?: unknown; origin?: unknown; payLater?: unknown; referredBy?: unknown; affiliateCode?: unknown };

async function checkoutInput(c: Context) {
  const userId = await requireUserId(c);
  const body = ((await c.req.json().catch(() => null)) ?? {}) as CheckoutBody;
  const offer = offerById(String(body.offerId ?? ""));
  const origin = String(body.origin ?? "");
  if (!offer || !ORIGIN.test(origin)) return null;
  const ref = typeof body.referredBy === "string" && REFERRAL.test(body.referredBy) ? body.referredBy : undefined;
  const meta = (orderId: string): GoldenMetadata => ({ order_id: orderId, golden_user_id: userId, offer: offer.id, ...(ref ? { referred_by: ref } : {}) });
  const affiliateCode = isAffiliateCode(body.affiliateCode) ? body.affiliateCode : undefined;
  return { offer, origin, body, meta, affiliateCode };
}

/** Starts a Whop checkout with Golden's order, account and plan attached (never taken from the browser's word). */
billing.post("/billing/checkout", rateLimit("checkout", 20), async (c) => {
  const input = await checkoutInput(c);
  if (!input) return c.json({ ok: false, error: "Unknown plan." }, 400);
  const metadata = input.meta(newOrderId());
  const returnUrl = `${input.origin}/checkout/return?order=${metadata.order_id}`;
  const prepared = await prepareWhopCheckout(input.offer, metadata, returnUrl, { payLater: input.body.payLater === true, affiliateCode: input.affiliateCode });
  if (!prepared.ok) return c.json(prepared, 502);
  // Not fatal: payment.succeeded upserts the order if this pending row is missing.
  await createOrder(metadata).catch((e) => console.error("[checkout] pending order not saved", e));
  return c.json({
    ok: true,
    orderId: metadata.order_id,
    metadata,
    returnUrl,
    ...("plan" in prepared ? { plan: prepared.plan } : { checkoutConfiguration: prepared.checkoutConfiguration }),
  });
});

/** Whop's hosted page for an order already started (when the embedded form is slow). */
billing.post("/billing/checkout/hosted", rateLimit("checkout", 20), async (c) => {
  const input = await checkoutInput(c);
  const orderId = String(input?.body.orderId ?? "");
  if (!input || !ORDER_ID.test(orderId)) return c.json({ error: "Please start checkout again." }, 400);
  const prepared = await prepareWhopCheckout(input.offer, input.meta(orderId), `${input.origin}/checkout/return?order=${orderId}`, { hosted: true, affiliateCode: input.affiliateCode });
  const url = prepared.ok && "purchaseUrl" in prepared ? prepared.purchaseUrl : undefined;
  return url ? c.json({ url }) : c.json({ error: "Whop isn't answering right now. Please try again in a minute." }, 502);
});

/**
 * Called after Google's purchase sheet closes (or to restore purchases). Premium only after
 * Google's API confirms the subscription belongs to this account and product.
 */
billing.post("/billing/play/verify", rateLimit("play-verify", 30), async (c) => {
  const userId = await requireUserId(c);
  const body = ((await c.req.json().catch(() => null)) ?? {}) as { productId?: unknown; purchaseToken?: unknown };
  const productId = String(body.productId ?? "");
  const purchaseToken = String(body.purchaseToken ?? "");
  const offer = offerForPlayProduct(productId);
  if (!offer) return c.json({ ok: false, error: "Unknown plan." }, 400);
  if (!/^[\w.:-]{20,2048}$/.test(purchaseToken)) return c.json({ ok: false, error: "That purchase couldn't be read." }, 400);
  if (!playApiConfigured()) return c.json({ ok: false, error: "Google Play purchases aren't switched on yet. You haven't been charged twice; contact support." }, 503);

  let verdict;
  try {
    verdict = judgePlaySubscription(await getPlaySubscription(purchaseToken), { userId, productId }, ENTITLED);
  } catch (e) {
    console.error("[play] verify failed", e);
    return c.json({ ok: false, error: "We couldn't reach Google Play to confirm your purchase. Try again in a moment." }, 502);
  }
  if (!verdict.ok) return c.json({ ok: false, error: verdict.reason }, 400);

  // Save before acknowledging: if saving fails, the unacknowledged purchase is retried by
  // "Restore purchases" instead of being acknowledged with no record of it.
  await saveSubscription({ provider: "google_play", externalId: purchaseToken, status: verdict.status, userId, currentPeriodEnd: verdict.expiry, offer });
  // Google refunds purchases left unacknowledged for 3 days, so a failed acknowledge must not pass
  // quietly: the app shows the error and "Restore purchases" retries (access is already saved).
  if (verdict.needsAck) {
    try {
      await acknowledgePlaySubscription(productId, purchaseToken);
    } catch (e) {
      console.error("[play] acknowledge failed", e);
      return c.json({ ok: false, error: "Your plan is saved, but Google Play didn't confirm it yet. Tap Restore purchases to finish." }, 502);
    }
  }
  return c.json({ ok: true, entitled: verdict.entitled, offer, trialEndsAt: verdict.status === "trialing" && verdict.expiry ? Date.parse(verdict.expiry) : undefined });
});

/** Whop: Standard Webhooks signature over the raw body (parsing first changes the bytes). */
billing.post("/billing/whop/webhook", async (c) => {
  if (!env.WHOP_WEBHOOK_SECRET) return c.json({ error: "Whop webhook secret not configured" }, 503);
  const payload = await c.req.text();
  let event: WhopEvent;
  try {
    event = unwrapWebhook<WhopEvent>(payload, { headers: c.req.header(), key: env.WHOP_WEBHOOK_SECRET });
  } catch {
    return c.json({ error: "Bad signature" }, 400);
  }
  // A database error throws → 500 → Whop retries, so a payment is never acknowledged unsaved.
  await handleWhopEvent(event);
  return c.text("OK");
});

/**
 * Play RTDN (Pub/Sub push to /api/billing/google/rtdn?token=<GOOGLE_RTDN_TOKEN>). The message only
 * says something changed; with the Play API configured the real state is fetched before saving.
 */
billing.post("/billing/google/rtdn", async (c) => {
  if (!env.GOOGLE_RTDN_TOKEN) return c.json({ error: "RTDN token not configured" }, 503);
  if (!sameSecret(c.req.query("token") ?? "", env.GOOGLE_RTDN_TOKEN)) return c.json({ error: "Unauthorised" }, 401);
  const message = decodeRtdn(await c.req.json().catch(() => null));
  if (!message) return c.json({ error: "Bad message" }, 400);
  if (message.packageName !== playPackageName()) return c.json({ error: "Wrong package" }, 400);

  const note = message.subscriptionNotification;
  if (note) {
    let update: SubscriptionUpdate | null = null;
    let ackProduct: string | undefined;
    if (playApiConfigured()) {
      try {
        const sub = await getPlaySubscription(note.purchaseToken);
        const status = playStatus(sub);
        const offer = sub.lineItems?.map((l) => offerForPlayProduct(l.productId)).find(Boolean);
        const owner = sub.externalAccountIdentifiers?.obfuscatedExternalAccountId;
        if (status) update = { provider: "google_play", externalId: note.purchaseToken, status, currentPeriodEnd: playExpiry(sub), ...(offer ? { offer } : {}), ...(owner && USER_ID.test(owner) ? { userId: owner } : {}) };
        if (sub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") ackProduct = sub.lineItems?.[0]?.productId;
      } catch (e) {
        // Ask Pub/Sub to redeliver later rather than guessing from the notification type.
        console.error("[rtdn] lookup failed", e);
        return c.json({ error: "Lookup failed, retry" }, 503);
      }
    } else {
      const status = rtdnStatus(note.notificationType);
      if (status) update = { provider: "google_play", externalId: note.purchaseToken, status };
    }
    if (update) await saveSubscription(update);
    // Second chance for a purchase the app couldn't acknowledge (Google refunds it after 3 days).
    if (ackProduct) {
      try {
        await acknowledgePlaySubscription(ackProduct, note.purchaseToken);
      } catch (e) {
        console.error("[rtdn] acknowledge failed", e);
        return c.json({ error: "Acknowledge failed, retry" }, 503);
      }
    }
  }
  // 2xx once handled so Pub/Sub doesn't redeliver forever.
  return c.json({ received: true });
});

/** App Store Server Notifications V2: POST { signedPayload }. */
billing.post("/billing/app-store/notifications", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { signedPayload?: string } | null;
  if (!body?.signedPayload) return c.json({ error: "signedPayload is required" }, 400);
  try {
    const note = verifyAppleJws<{ notificationType: string; subtype?: string; data?: { bundleId?: string; signedTransactionInfo?: string } }>(body.signedPayload);
    if (env.APPLE_BUNDLE_ID && note.data?.bundleId !== env.APPLE_BUNDLE_ID) return c.json({ error: "Wrong bundle" }, 400);
    const status = appStoreStatus(note.notificationType, note.subtype);
    if (status && note.data?.signedTransactionInfo) {
      const tx = verifyAppleJws<{ originalTransactionId: string; appAccountToken?: string; expiresDate?: number }>(note.data.signedTransactionInfo);
      await saveSubscription({
        provider: "app_store",
        externalId: tx.originalTransactionId,
        status,
        // shortcut: Apple's appAccountToken must be a UUID and our account ids aren't; map account → UUID when StoreKit purchases are built.
        userId: tx.appAccountToken && USER_ID.test(tx.appAccountToken) ? tx.appAccountToken : undefined,
        currentPeriodEnd: tx.expiresDate ? new Date(tx.expiresDate).toISOString() : undefined,
      });
    }
    return c.json({ received: true });
  } catch (err) {
    if (err instanceof JwsError) return c.json({ error: err.message }, 400);
    throw err;
  }
});
