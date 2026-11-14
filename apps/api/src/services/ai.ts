// Gemini over REST. The key stays in the API; every caller has a deterministic fallback in the web,
// so any failure here returns null / a "failed" reason instead of throwing.

import { MISTAKES, validateAdapted, type AdaptedRecipe, type Fix, type MistakeId, type Recipe, type SkillLevel } from "@golden/shared";

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
type Opts = { temperature?: number; timeoutMs?: number; fetchImpl?: typeof fetch };

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Asks Gemini for a JSON answer. Returns the parsed value, or null on any failure. */
export async function generateJson(parts: Part[], { temperature = 0.4, timeoutMs = 12_000, fetchImpl = fetch }: Opts = {}): Promise<unknown | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature } }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

const VOICE: Record<SkillLevel, string> = {
  beginner: "a patient teacher for a first-time cook: short micro-steps, sensory cues and plain-English definitions of any jargon",
  intermediate: "a line cook: standard kitchen shorthand, concise, with notes on what can run in parallel",
  chef: "a head chef: technique-forward, precise temperatures and reduction targets, flavour and food-science notes",
};

/** Rewrites a recipe's steps for a level; null unless the answer fits the recipe's structure. */
export async function adaptWithAi(recipe: Recipe, skill: SkillLevel, fetchImpl?: typeof fetch): Promise<AdaptedRecipe | null> {
  const prompt = [
    `Rewrite each step of this recipe in the voice of ${VOICE[skill]}.`,
    "Keep the same number of steps, in the same order. Don't change quantities, times or temperatures.",
    'Reply only with JSON: {"steps":[{"instructions":["..."],"notes":["..."]}]}.',
    JSON.stringify({ title: recipe.title, ingredients: recipe.ingredients, steps: recipe.blocks }),
  ].join("\n");
  const answer = await generateJson([{ text: prompt }], { fetchImpl });
  try {
    return validateAdapted(recipe, skill, answer);
  } catch {
    return null; // a malformed posted recipe
  }
}

/** One short extra tip for this dish on top of the deterministic fix. */
export async function fixTip(title: string, fix: Fix, fetchImpl?: typeof fetch): Promise<string | undefined> {
  const answer = (await generateJson(
    [{ text: `A cook making "${title}" has this problem: ${fix.mistake}. The standard fix is: ${fix.steps.join(" ")} Add one short extra tip specific to this dish. Reply only with JSON: {"tip":"..."}.` }],
    { fetchImpl },
  )) as { tip?: unknown } | null;
  return typeof answer?.tip === "string" && answer.tip.length < 300 ? answer.tip : undefined;
}

export type Diagnosis = { ok: true; mistake: MistakeId; note: string } | { ok: false; reason: "no-ai" | "unclear" | "failed" };

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

/** Gemini looks at the dish and picks the closest problem from our catalogue; the fix itself comes from the catalogue. */
export async function diagnosePhoto(photo: string, dish: string, fetchImpl?: typeof fetch): Promise<Diagnosis> {
  if (!geminiConfigured()) return { ok: false, reason: "no-ai" };
  const m = photo.match(DATA_URL);
  if (!m) return { ok: false, reason: "failed" };
  const options = MISTAKES.map((x) => `"${x.id}" (${x.label})`).join(", ");
  const prompt =
    `This is a photo of "${dish}" that a home cook thinks has gone wrong. ` +
    `Pick the single closest problem from this list: ${options}. ` +
    `If you can't tell from the photo, use "unclear". ` +
    `Reply only with JSON: {"mistake":"<id or unclear>","note":"<one short sentence on what you see>"}.`;
  const parsed = (await generateJson([{ inlineData: { mimeType: m[1], data: m[2] } }, { text: prompt }], { temperature: 0.2, timeoutMs: 30_000, fetchImpl })) as {
    mistake?: string;
    note?: unknown;
  } | null;
  if (!parsed) return { ok: false, reason: "failed" };
  const hit = MISTAKES.find((x) => x.id === parsed.mistake);
  if (!hit) return { ok: false, reason: "unclear" };
  return { ok: true, mistake: hit.id, note: typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "" };
}
