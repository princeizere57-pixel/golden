"use server";

import { diagnosePhoto, type Diagnosis } from "@/lib/ai/diagnose";
import { getUser } from "@/lib/auth";

/** Signed-in users only; the photo must be a small image data URL. */
export async function diagnoseDish(photo: string, dish: string): Promise<Diagnosis> {
  if (!(await getUser())) return { ok: false, reason: "failed" };
  if (typeof photo !== "string" || photo.length > 1_500_000) return { ok: false, reason: "failed" };
  return diagnosePhoto(photo, String(dish).slice(0, 80));
}

export async function photoDiagnosisAvailable(): Promise<boolean> {
  return Boolean(process.env.GEMINI_API_KEY);
}
