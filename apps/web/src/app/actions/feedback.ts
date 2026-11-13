"use server";

// Saves in-app feedback (rating + optional note) to Supabase. Never blocks the cook: if storage
// isn't configured or fails, the app still says thanks and the error is only logged.

import { getUser } from "@/lib/auth";
import { cleanFeedback, validRating } from "@/lib/feedback";

export async function sendFeedback(rating: number, message: string, mealsFinished: number): Promise<{ ok: boolean }> {
  if (!validRating(rating)) return { ok: false };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const row = {
    user_id: (await getUser())?.id ?? null,
    rating,
    message: cleanFeedback(message),
    meals_finished: Number.isFinite(mealsFinished) ? Math.max(0, Math.floor(mealsFinished)) : null,
  };
  if (!url || !key) {
    console.info("[feedback] Supabase not configured", { rating: row.rating, hasMessage: Boolean(row.message) });
    return { ok: true };
  }
  try {
    const res = await fetch(`${url}/rest/v1/feedback`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      // A real auth.users id or nothing: demo sign-ins aren't real accounts.
      body: JSON.stringify({ ...row, user_id: row.user_id && /^[0-9a-f-]{36}$/i.test(row.user_id) ? row.user_id : null }),
    });
    if (!res.ok) console.error("[feedback] save failed", res.status, await res.text());
    return { ok: res.ok };
  } catch (e) {
    console.error("[feedback] save failed", e);
    return { ok: false };
  }
}
