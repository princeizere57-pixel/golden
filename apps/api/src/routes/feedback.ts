import { feedbackPostSchema } from "@golden/shared";
import { Hono } from "hono";
import { saveFeedback } from "../services/feedback.js";
import { rateLimit } from "../services/rate-limit.js";
import { optionalUserId } from "../session.js";

export const feedback = new Hono();

feedback.post("/feedback", rateLimit("feedback", 5, 3600, 60), async (c) => {
  const body = feedbackPostSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid feedback" }, 400);
  await saveFeedback(await optionalUserId(c), body.data.rating, body.data.message, body.data.mealsFinished);
  return c.json({ ok: true });
});
