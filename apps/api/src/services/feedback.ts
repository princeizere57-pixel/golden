import { cleanFeedback } from "@golden/shared";
import { getDb } from "../db/client.js";
import { feedback } from "../db/schema.js";
import { getProgress } from "./progress.js";

/** Signed-in feedback counts meals from the server's progress, not from what the browser says. */
export async function saveFeedback(userId: string | null, rating: number, message: unknown, clientMeals?: number) {
  const meals = userId ? ((await getProgress(userId))?.dishes ?? 0) : (clientMeals ?? null);
  await getDb().insert(feedback).values({ userId, rating, message: cleanFeedback(message), mealsFinished: meals });
}
