// Founding-launch numbers shown on the landing page and checkout. Server-only.
// Spots taken is a real count of active or trialing memberships in Supabase; it shows 0 when the
// database isn't connected yet, never an invented number.

import "server-only";
import { FOUNDING_SPOTS, LAUNCH_ENDS_AT } from "@/lib/billing/offers";

export interface LaunchState {
  spots: number;
  taken: number;
  left: number;
  endsAt: string;
  open: boolean;
}

export async function spotsTaken(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 0;
  try {
    const res = await fetch(`${url}/rest/v1/subscriptions?select=external_id&status=in.(active,trialing)`, {
      method: "HEAD",
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
      next: { revalidate: 300 },
    });
    const total = Number(res.headers.get("content-range")?.split("/")[1]);
    return res.ok && Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
}

export async function launchState(now = Date.now()): Promise<LaunchState> {
  const taken = Math.min(FOUNDING_SPOTS, await spotsTaken());
  const left = FOUNDING_SPOTS - taken;
  return { spots: FOUNDING_SPOTS, taken, left, endsAt: LAUNCH_ENDS_AT, open: left > 0 && now < Date.parse(LAUNCH_ENDS_AT) };
}
