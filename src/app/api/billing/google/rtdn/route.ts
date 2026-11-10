import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { decodeRtdn, playStatus } from "@/lib/billing/google-play";
import { getPlaySubscription, playApiConfigured, playExpiry, playPackageName, playStateToStatus } from "@/lib/billing/google-play-api";
import { saveSubscription, type SubscriptionUpdate } from "@/lib/billing/subscriptions";

const sameSecret = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pub/Sub push endpoint for Play RTDN. Configure the push URL as
 * /api/billing/google/rtdn?token=<GOOGLE_RTDN_TOKEN> (or enable Pub/Sub OIDC auth in front).
 * The notification only says *something* changed; with the Play API configured, Golden asks
 * Google for the subscription's real state before saving it.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.GOOGLE_RTDN_TOKEN;
  if (!expected) return NextResponse.json({ error: "RTDN token not configured" }, { status: 503 });
  if (!sameSecret(req.nextUrl.searchParams.get("token") ?? "", expected)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const message = decodeRtdn(await req.json().catch(() => null));
  if (!message) return NextResponse.json({ error: "Bad message" }, { status: 400 });
  if (message.packageName !== playPackageName()) return NextResponse.json({ error: "Wrong package" }, { status: 400 });

  const note = message.subscriptionNotification;
  if (note) {
    let update: SubscriptionUpdate | null = null;
    if (playApiConfigured()) {
      try {
        const sub = await getPlaySubscription(note.purchaseToken);
        const status = playStateToStatus(sub.subscriptionState);
        const owner = sub.externalAccountIdentifiers?.obfuscatedExternalAccountId;
        if (status) update = { provider: "google_play", externalId: note.purchaseToken, status, currentPeriodEnd: playExpiry(sub), ...(owner && UUID.test(owner) ? { userId: owner } : {}) };
      } catch (e) {
        // Ask Pub/Sub to redeliver later rather than guessing from the notification type.
        console.error("[rtdn] lookup failed", e);
        return NextResponse.json({ error: "Lookup failed, retry" }, { status: 503 });
      }
    } else {
      const status = playStatus(note.notificationType);
      if (status) update = { provider: "google_play", externalId: note.purchaseToken, status };
    }
    if (update) await saveSubscription(update);
  }
  // Always 2xx once handled so Pub/Sub doesn't redeliver forever.
  return NextResponse.json({ received: true });
}
