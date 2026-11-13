// Gemini over REST. Server-only: the key never reaches the browser. Callers must handle a
// null result by using their deterministic fallback.

import "server-only";

type Fetch = typeof fetch;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Asks Gemini for a JSON answer. Returns the parsed value, or null on any failure. */
export async function generateJson(
  prompt: string,
  { fetchImpl = fetch, timeoutMs = 12_000 }: { fetchImpl?: Fetch; timeoutMs?: number } = {},
): Promise<unknown | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  try {
    const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
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
