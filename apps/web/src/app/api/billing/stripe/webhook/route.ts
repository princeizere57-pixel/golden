import { NextResponse, type NextRequest } from "next/server";
import { verifyStripeSignature, webhookSecret } from "@/lib/billing/stripe";
import { saveSubscription, type SubscriptionStatus } from "@/lib/billing/subscriptions";
import type { BillingEntity } from "@/lib/types";

const STATUS: Record<string, SubscriptionStatus> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "past_due",
  paused: "paused",
  canceled: "expired",
  incomplete_expired: "expired",
};

interface StripeSubscription {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: { user_id?: string };
}

/** One endpoint per entity: /api/billing/stripe/webhook?entity=us|uk, each with its own secret. */
export async function POST(req: NextRequest) {
  const entity: BillingEntity = req.nextUrl.searchParams.get("entity") === "uk" ? "uk" : "us";
  const secret = webhookSecret(entity);
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: StripeSubscription } };
  if (!event.type.startsWith("customer.subscription.")) return NextResponse.json({ received: true });

  const sub = event.data.object;
  const mapped = STATUS[sub.status];
  if (mapped) {
    await saveSubscription({
      provider: "web",
      externalId: sub.id,
      status: mapped === "active" && sub.cancel_at_period_end ? "canceled" : mapped,
      userId: sub.metadata?.user_id,
      entity,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
    });
  }
  return NextResponse.json({ received: true });
}
