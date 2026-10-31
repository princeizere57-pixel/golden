import { unwrapWebhook } from "@whop/sdk/helpers";
import { NextResponse, type NextRequest } from "next/server";
import { offerById } from "@/lib/billing/offers";
import { saveSubscription } from "@/lib/billing/subscriptions";
import { whopStatus, type WhopMembership } from "@/lib/billing/whop";

interface WhopPayment {
  id: string;
  status?: string;
  membership_id?: string | null;
  user_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

type WhopEvent = { type?: string; data?: Record<string, unknown> };

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

/**
 * Whop webhook. payment.succeeded fulfils the order Golden created (metadata.order_id,
 * metadata.golden_user_id); membership.activated / membership.updated keep renewals in sync.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Whop webhook secret not configured" }, { status: 503 });

  // The raw body: parsing it first changes the bytes and the signature check fails.
  const payload = await request.text();
  let event: WhopEvent;
  try {
    event = unwrapWebhook<WhopEvent>(payload, { headers: Object.fromEntries(request.headers), key: secret });
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (event.type === "payment.succeeded" && event.data) await fulfillPayment(event.data as unknown as WhopPayment);
  if (event.type?.startsWith("membership.") && event.data?.id) await syncMembership(event.data as unknown as WhopMembership);

  // Respond quickly, or Whop retries.
  return new Response("OK", { status: 200 });
}

async function fulfillPayment(payment: WhopPayment) {
  const meta = payment.metadata ?? {};
  const orderId = str(meta.order_id);
  const userId = str(meta.golden_user_id);
  const offer = offerById(str(meta.offer) ?? "");
  console.log(`[PAYMENT SUCCEEDED] ${payment.id} for order ${orderId} (${offer?.id ?? "unknown offer"})`);
  await markOrderPaid(orderId, payment.id);
  // One-time offers have no membership renewals to follow, so grant access from the payment.
  if (offer?.planType === "one_time" && offer.id === "lifetime" && userId) {
    await saveSubscription({ provider: "whop", externalId: payment.id, status: "active", userId, whopUserId: payment.user_id ?? undefined });
  }
}

async function syncMembership(membership: WhopMembership) {
  const status = whopStatus(membership);
  if (!status) return;
  const appUser = membership.metadata?.golden_user_id ?? membership.metadata?.app_user_id;
  await saveSubscription({
    provider: "whop",
    externalId: membership.id,
    status,
    userId: typeof appUser === "string" ? appUser : undefined,
    whopUserId: membership.user_id ?? undefined,
    currentPeriodEnd: membership.current_period_end ?? undefined,
  });
}

async function markOrderPaid(orderId: string | undefined, paymentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !orderId) return;
  await fetch(`${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: "paid", whop_payment_id: paymentId, updated_at: new Date().toISOString() }),
  }).catch(() => {});
}
