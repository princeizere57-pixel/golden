// Game layer: XP, chef ranks, streaks and Mini You's mood. Pure, so it's easy to test.

export const XP = { cooked: 50, fixed: 15, quiz: 20, saved: 2 } as const;

export const RANKS = [
  { xp: 0, title: "Kitchen Porter" },
  { xp: 100, title: "Commis Chef" },
  { xp: 300, title: "Line Cook" },
  { xp: 700, title: "Chef de Partie" },
  { xp: 1500, title: "Sous Chef" },
  { xp: 3000, title: "Head Chef" },
] as const;

export function rankFor(xp: number) {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.xp) index = i;
  });
  const next = RANKS[index + 1];
  const floor = RANKS[index].xp;
  return {
    index,
    title: RANKS[index].title,
    next: next?.title,
    /** 0–1 progress towards the next rank (1 at the top rank). */
    progress: next ? (xp - floor) / (next.xp - floor) : 1,
    toNext: next ? next.xp - xp : 0,
  };
}

/** YYYY-MM-DD in local time. */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Cooking today keeps the streak; yesterday extends it; a gap resets it to 1. */
export function nextStreak(lastDay: string | null, streak: number, today: string): number {
  if (!lastDay) return 1;
  const gap = daysBetween(lastDay, today);
  if (gap <= 0) return Math.max(1, streak);
  return gap === 1 ? streak + 1 : 1;
}

/** Streak as shown today: still alive if you cooked today or yesterday. */
export function liveStreak(lastDay: string | null, streak: number, today: string): number {
  if (!lastDay) return 0;
  return daysBetween(lastDay, today) <= 1 ? streak : 0;
}

export type Mood = "neutral" | "happy" | "proud" | "sad" | "focused";

/** Moods fade back to neutral after a few hours. */
export function currentMood(mood: { state: Mood; at: number } | undefined, now: number): Mood {
  if (!mood) return "neutral";
  return now - mood.at < 6 * 3_600_000 ? mood.state : "neutral";
}

/** What Mini You says about its mood. */
export const MOOD_LINES: Record<Mood, string[]> = {
  neutral: ["What are we cooking today?", "Pick a dish and I'll walk you through it."],
  happy: ["That looked delicious. Nice work!", "Another dish done. You're getting good at this."],
  proud: ["New rank! Look at you go.", "Promoted! The kitchen's noticing."],
  sad: ["Oops. Happens to every chef. Let's fix it.", "Don't worry, mistakes are how cooks learn."],
  focused: ["Eyes on the pan. You've got this.", "One step at a time."],
};
