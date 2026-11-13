// When to ask for feedback: only after someone has finished at least three meals, never again
// once they've answered, and if they skip, not until three more meals later. Pure and tested.

export const FEEDBACK_AFTER_MEALS = 3;
export const FEEDBACK_MAX_LENGTH = 1000;

export interface FeedbackMemory {
  /** They sent feedback: never ask again. */
  sent: boolean;
  /** Meals finished when they last tapped "Not now", if they did. */
  skippedAt: number | null;
}

export function shouldAskFeedback(mealsFinished: number, memory: FeedbackMemory): boolean {
  if (memory.sent || mealsFinished < FEEDBACK_AFTER_MEALS) return false;
  if (memory.skippedAt === null) return true;
  return mealsFinished >= memory.skippedAt + FEEDBACK_AFTER_MEALS;
}

/** What to keep from what they typed: trimmed, length-capped, empty → null. */
export function cleanFeedback(message: unknown): string | null {
  if (typeof message !== "string") return null;
  const text = message.replace(/\s+\n/g, "\n").trim().slice(0, FEEDBACK_MAX_LENGTH);
  return text || null;
}

export const validRating = (n: unknown): n is 1 | 2 | 3 | 4 | 5 => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;

/** A prompt that fits the rating they just tapped. */
export function feedbackQuestion(rating: number): string {
  if (rating <= 2) return "Sorry about that. What went wrong?";
  if (rating === 3) return "What would make Golden better for you?";
  return "Glad it's helping! What do you like most?";
}
