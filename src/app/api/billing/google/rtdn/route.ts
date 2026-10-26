import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { decodeRtdn, playStatus } from "@/lib/billing/google-play";
import { saveSubscription } from "@/lib/billing/subscriptions";

const sameSecret = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Pub/Sub push endpoint for Play RTDN. Configure the push URL as
 * /api/billing/google/rtdn?token=<GOOGLE_RTDN_TOKEN> (or enable Pub/Sub OIDC auth in front).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.GOOGLE_RTDN_TOKEN;
  if (!expected) return NextResponse.json({ error: "RTDN token not configured" }, { status: 503 });
  if (!sameSecret(req.nextUrl.searchParams.get("token") ?? "", expected)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const message = decodeRtdn(await req.json().catch(() => null));
  if (!message) return NextResponse.json({ error: "Bad message" }, { status: 400 });
  const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  if (pkg && message.packageName !== pkg) return NextResponse.json({ error: "Wrong package" }, { status: 400 });

  const note = message.subscriptionNotification;
  const status = note ? playStatus(note.notificationType) : null;
  if (note && status) await saveSubscription({ provider: "google_play", externalId: note.purchaseToken, status });
  // Always 2xx once authenticated so Pub/Sub doesn't redeliver forever.
  return NextResponse.json({ received: true });
}
