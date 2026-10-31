"use server";

import { cartoonize, type CartoonResult } from "@/lib/ai/cartoon";
import { getUser } from "@/lib/auth";

/** Signed-in users only; the photo must be a small image data URL. */
export async function makeCartoon(photo: string): Promise<CartoonResult> {
  if (!(await getUser())) return { ok: false, reason: "failed" };
  if (typeof photo !== "string" || photo.length > 1_500_000) return { ok: false, reason: "failed" };
  return cartoonize(photo);
}
