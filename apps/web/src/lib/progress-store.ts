// Mini You, XP, streak and the kitchen log. The rules live in @golden/shared (applyEvent): this
// device applies them at once for an instant UI, then the account's server applies the same rules
// and its answer replaces the device copy (lib/sync). Client-side only.

import { dayKey, type Mood } from "@/lib/gamify";
import { STORE_EVENT, sendProgressEvent } from "@/lib/sync";
import { EMPTY_PROGRESS, applyEvent, normalizeProgress, type Avatar, type Progress, type ProgressEvent } from "@/lib/types";

export type { Avatar, LogEntry, LogKind, Progress } from "@/lib/types";
export { DEFAULT_AVATAR } from "@/lib/types";

const KEY = "bac-progress";

export function readProgress(): Progress {
  try {
    // Unknown avatar fields (old photo/cartoon options) are dropped; the next save removes them.
    return normalizeProgress(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return EMPTY_PROGRESS;
  }
}

function record(event: ProgressEvent) {
  const result = applyEvent(readProgress(), event, {
    now: Date.now(),
    today: dayKey(new Date()),
    newId: () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(result.progress));
  } catch {
    // Storage full or blocked: keep going for this visit.
  }
  window.dispatchEvent(new Event(STORE_EVENT));
  sendProgressEvent(event);
  return result;
}

export function recordCooked(title: string, image?: string): { xp: number; streak: number; rankedUp: boolean } {
  const { xp, streak, rankedUp } = record({ type: "cooked", title, image, today: dayKey(new Date()) });
  return { xp, streak, rankedUp };
}

export const recordMistake = (label: string, dish: string) => void record({ type: "mistake", label, dish });
export const recordFixed = (headline: string) => void record({ type: "fixed", headline });
export const recordActivity = (kind: "saved" | "listed", title: string, detail: string, image?: string) => void record({ type: "activity", kind, title, detail, image });
export const setMood = (state: Mood) => void record({ type: "mood", state });
export const updateAvatar = (change: Partial<Avatar>) => void record({ type: "avatar", change });

/** Picks boy or girl; the girl starts with dark brown curls and no beard. */
export function chooseFigure(figure: Avatar["figure"]) {
  updateAvatar(figure === "girl" ? { figure, hair: "#4a2c1d", beard: false } : { figure });
}
