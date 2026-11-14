// Founding-launch numbers and Whop options for the checkout page, from our API. Server-only.
// Spots taken is a real count of people on a live plan; it shows 0 when the API can't be
// reached, never an invented number.

import "server-only";
import { cache } from "react";
import { apiOrigin } from "@/lib/api-origin";
import { FOUNDING_SPOTS, LAUNCH_ENDS_AT, type OfferId } from "@/lib/billing/offers";

export interface CheckoutFacts {
  spotsTaken: number;
  /** Whop API configured: pay later and the hosted page work. */
  payLater: boolean;
  /** Offers Whop can sell right now. */
  embed: Partial<Record<OfferId, boolean>>;
}

const UNKNOWN: CheckoutFacts = { spotsTaken: 0, payLater: false, embed: {} };

export const checkoutFacts = cache(async (): Promise<CheckoutFacts> => {
  try {
    const res = await fetch(`${apiOrigin()}/billing/checkout`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000) });
    if (res.ok) return { ...UNKNOWN, ...((await res.json()) as Partial<CheckoutFacts>) };
  } catch {
    // Unreachable: nothing sells until it answers, and the count stays honest at 0.
  }
  return UNKNOWN;
});

export interface LaunchState {
  spots: number;
  taken: number;
  left: number;
  endsAt: string;
  open: boolean;
}

export async function launchState(now = Date.now()): Promise<LaunchState> {
  const taken = Math.min(FOUNDING_SPOTS, (await checkoutFacts()).spotsTaken);
  const left = FOUNDING_SPOTS - taken;
  return { spots: FOUNDING_SPOTS, taken, left, endsAt: LAUNCH_ENDS_AT, open: left > 0 && now < Date.parse(LAUNCH_ENDS_AT) };
}
