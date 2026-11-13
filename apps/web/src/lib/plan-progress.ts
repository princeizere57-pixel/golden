// Which dishes in the current meal plan are finished. Device copy, synced to the account. Client-side only.

import { STORE_EVENT, schedulePush } from "@/lib/sync";

const KEY = "bac-plan-done";

export function listPlanDone(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {}
  window.dispatchEvent(new Event(STORE_EVENT));
  schedulePush(KEY);
}

export const markPlanDone = (slug: string) => write([...new Set([...listPlanDone(), slug])]);
export const unmarkPlanDone = (slug: string) => write(listPlanDone().filter((s) => s !== slug));
/** Starting a new plan clears finished marks for dishes not in it. */
export const keepOnly = (slugs: string[]) => write(listPlanDone().filter((s) => slugs.includes(s)));
