// The Golden Giveaway (attraction offer): one winner and the friend who referred them each get a
// year of Golden. Free to enter. Entries live in Supabase (`giveaway_entries`). Server-only.

import "server-only";
import { createHash } from "node:crypto";

export const GIVEAWAY = {
  /** Draw date shown to entrants. Change before launch and keep the rules page in sync. */
  endsAt: "2026-12-31T23:59:59Z",
  prize: "1 year of Golden Premium for the winner, plus 1 year for the friend who referred them",
};

export const REF_COOKIE = "bac-ref";

/** Short, stable referral code for a user (no personal data in it). */
export function referralCode(userId: string): string {
  return createHash("sha256").update(`golden-ref:${userId}`).digest("base64url").replace(/[-_]/g, "").slice(0, 8).toUpperCase();
}

export const isValidCode = (code: unknown): code is string => typeof code === "string" && /^[A-Z0-9]{6,12}$/.test(code);

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } } : null;
}

export interface Entry {
  user_id: string;
  name: string;
  email: string;
  code: string;
  referred_by: string | null;
}

/** Enters a user once (idempotent on user_id). Returns false when storage isn't configured. */
export async function saveEntry(entry: Entry, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const db = supabase();
  if (!db) return false;
  const res = await fetchImpl(`${db.url}/rest/v1/giveaway_entries?on_conflict=user_id`, {
    method: "POST",
    headers: { ...db.headers, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(entry),
  });
  return res.ok;
}

export async function getEntry(userId: string, fetchImpl: typeof fetch = fetch): Promise<{ code: string; referrals: number } | null> {
  const db = supabase();
  if (!db) return null;
  try {
    const mine = await fetchImpl(`${db.url}/rest/v1/giveaway_entries?user_id=eq.${encodeURIComponent(userId)}&select=code`, { headers: db.headers });
    const rows = (await mine.json()) as Array<{ code: string }>;
    if (!rows.length) return null;
    const refs = await fetchImpl(`${db.url}/rest/v1/giveaway_entries?referred_by=eq.${rows[0].code}&select=user_id`, { headers: { ...db.headers, Prefer: "count=exact" } });
    const count = Number(refs.headers.get("content-range")?.split("/")[1] ?? 0);
    return { code: rows[0].code, referrals: Number.isFinite(count) ? count : 0 };
  } catch {
    return null;
  }
}
