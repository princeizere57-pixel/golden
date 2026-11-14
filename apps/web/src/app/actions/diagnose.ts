"use server";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { MistakeId } from "@/lib/recovery/fixes";

export type Diagnosis = { ok: true; mistake: MistakeId; note: string } | { ok: false; reason: "no-ai" | "unclear" | "failed" };

/** Signed-in users only; the photo must be a small image data URL. The API checks the plan and asks Gemini. */
export async function diagnoseDish(photo: string, dish: string): Promise<Diagnosis> {
  if (!(await getUser())) return { ok: false, reason: "failed" };
  if (typeof photo !== "string" || photo.length > 1_500_000) return { ok: false, reason: "failed" };
  try {
    const res = await apiFetch("/ai/diagnose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ photo, dish: String(dish).slice(0, 80) }), signal: AbortSignal.timeout(35_000) });
    return res.ok ? ((await res.json()) as Diagnosis) : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
