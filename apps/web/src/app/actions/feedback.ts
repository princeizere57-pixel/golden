"use server";

// Saves in-app feedback (rating + optional note) through our API. Never blocks the cook: if the
// save fails, the app still says thanks and the error is only logged. For signed-in cooks the API
// counts meals from the account's own progress, not from this number.

import { apiFetch } from "@/lib/api";
import { validRating } from "@/lib/feedback";

export async function sendFeedback(rating: number, message: string, mealsFinished: number): Promise<{ ok: boolean }> {
  if (!validRating(rating)) return { ok: false };
  try {
    const res = await apiFetch("/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating, message, mealsFinished: Number.isFinite(mealsFinished) ? Math.max(0, Math.floor(mealsFinished)) : undefined }),
    });
    if (!res.ok) console.error("[feedback] save failed", res.status);
    return { ok: res.ok };
  } catch (e) {
    console.error("[feedback] save failed", e);
    return { ok: false };
  }
}
