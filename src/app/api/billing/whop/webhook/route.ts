import { NextResponse, type NextRequest } from "next/server";
import { saveSubscription } from "@/lib/billing/subscriptions";
import { verifyWhopSignature, whopStatus, type WhopMembership } from "@/lib/billing/whop";

/** Whop webhook: membership.activated / membership.updated keep `subscriptions` in sync. */
export async function POST(req: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Whop webhook secret not configured" }, { status: 503 });
  const body = await req.text();
  const ok = verifyWhopSignature(body, {
    id: req.headers.get("webhook-id"),
    timestamp: req.headers.get("webhook-timestamp"),
    signature: req.headers.get("webhook-signature"),
  }, secret);
  if (!ok) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

  const event = JSON.parse(body) as { type?: string; data?: WhopMembership };
  if (!event.type?.startsWith("membership.") || !event.data?.id) return NextResponse.json({ received: true });

  const membership = event.data;
  const status = whopStatus(membership);
  if (status) {
    const appUser = membership.metadata?.app_user_id;
    await saveSubscription({
      provider: "whop",
      externalId: membership.id,
      status,
      userId: typeof appUser === "string" ? appUser : undefined,
      whopUserId: membership.user_id ?? undefined,
      currentPeriodEnd: membership.current_period_end ?? undefined,
    });
  }
  return NextResponse.json({ received: true });
}
