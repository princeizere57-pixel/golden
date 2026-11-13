// Google Play Real-time Developer Notifications, delivered by a Pub/Sub push subscription.

import type { SubscriptionStatus } from "@/lib/billing/subscriptions";

export interface RtdnSubscription {
  notificationType: number;
  purchaseToken: string;
  subscriptionId?: string;
}

export interface RtdnMessage {
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: RtdnSubscription;
  testNotification?: { version: string };
}

/** Decodes the Pub/Sub push envelope `{ message: { data: base64(json) } }`. */
export function decodeRtdn(body: unknown): RtdnMessage | null {
  const data = (body as { message?: { data?: unknown } })?.message?.data;
  if (typeof data !== "string") return null;
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8")) as RtdnMessage;
  } catch {
    return null;
  }
}

/**
 * Maps SubscriptionNotification types to our status (null = no change).
 * In production, confirm the state with purchases.subscriptionsv2.get before granting access.
 */
export function playStatus(type: number): SubscriptionStatus | null {
  switch (type) {
    case 1: // RECOVERED
    case 2: // RENEWED
    case 4: // PURCHASED
    case 7: // RESTARTED
      return "active";
    case 3: // CANCELED (access continues until expiry)
      return "canceled";
    case 5: // ON_HOLD
      return "past_due";
    case 6: // IN_GRACE_PERIOD
      return "grace";
    case 10: // PAUSED
      return "paused";
    case 12: // REVOKED
      return "revoked";
    case 13: // EXPIRED
      return "expired";
    default:
      return null;
  }
}
