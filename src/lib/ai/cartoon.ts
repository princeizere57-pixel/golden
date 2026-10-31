// Turns a selfie into a 3D cartoon chef with Gemini's image model. Server-only; the photo is
// sent to Google only when the user explicitly asks for a cartoon.

import "server-only";

type Fetch = typeof fetch;

export const CARTOON_PROMPT = [
  "Turn the person in this photo into a cute, high-quality 3D animated cartoon character (Pixar-like style).",
  "Keep their likeness: face shape, skin tone, hairstyle and hair colour, facial hair, and glasses if they wear them.",
  "Full body, standing, friendly smile, one hand gesturing welcome.",
  "Dress them as a chef: tall white chef's hat, white double-breasted chef's jacket with an orange neckerchief, dark trousers, white sneakers.",
  "Plain pure white background, soft studio lighting, no text, no logos.",
].join(" ");

export type CartoonResult = { ok: true; image: string } | { ok: false; reason: "not-configured" | "failed" | "blocked" };

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function cartoonize(photo: string, fetchImpl: Fetch = fetch): Promise<CartoonResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, reason: "not-configured" };
  const match = photo.match(DATA_URL);
  if (!match) return { ok: false, reason: "failed" };
  const model = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
  try {
    const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: match[1], data: match[2] } }, { text: CARTOON_PROMPT }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) return { ok: false, reason: "failed" };
    const body = (await res.json()) as {
      promptFeedback?: { blockReason?: string };
      candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
    };
    if (body.promptFeedback?.blockReason) return { ok: false, reason: "blocked" };
    const part = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) return { ok: false, reason: body.candidates?.[0]?.finishReason === "SAFETY" ? "blocked" : "failed" };
    return { ok: true, image: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}` };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
