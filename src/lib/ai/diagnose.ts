// Optional photo diagnosis for Fix My Mistake: Gemini looks at the dish and picks the closest
// problem from our recovery database. The fix itself always comes from the database. Server-only.

import "server-only";
import { MISTAKES, type MistakeId } from "@/lib/recovery/fixes";

export type Diagnosis = { ok: true; mistake: MistakeId; note: string } | { ok: false; reason: "no-ai" | "unclear" | "failed" };

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function diagnosePhoto(photo: string, dish: string, fetchImpl: typeof fetch = fetch): Promise<Diagnosis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, reason: "no-ai" };
  const m = photo.match(DATA_URL);
  if (!m) return { ok: false, reason: "failed" };
  const options = MISTAKES.map((x) => `"${x.id}" (${x.label})`).join(", ");
  const prompt =
    `This is a photo of "${dish}" that a home cook thinks has gone wrong. ` +
    `Pick the single closest problem from this list: ${options}. ` +
    `If you can't tell from the photo, use "unclear". ` +
    `Reply only with JSON: {"mistake":"<id or unclear>","note":"<one short sentence on what you see>"}.`;
  try {
    const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: m[1], data: m[2] } }, { text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { ok: false, reason: "failed" };
    const body = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    const parsed = text ? (JSON.parse(text) as { mistake?: string; note?: string }) : null;
    const hit = MISTAKES.find((x) => x.id === parsed?.mistake);
    if (!hit) return { ok: false, reason: "unclear" };
    return { ok: true, mistake: hit.id, note: typeof parsed?.note === "string" ? parsed.note.slice(0, 200) : "" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
