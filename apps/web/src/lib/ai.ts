import "server-only";
import { cache } from "react";
import { apiOrigin } from "@/lib/api-origin";

/** Whether the API has a Gemini key (photo check on). False when the API can't be reached. */
export const aiReady = cache(async (): Promise<boolean> => {
  try {
    const res = await fetch(`${apiOrigin()}/ai`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000) });
    return res.ok && ((await res.json()) as { ready?: boolean }).ready === true;
  } catch {
    return false;
  }
});
