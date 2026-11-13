import { progressEventSchema, progressSeedSchema } from "@golden/shared";
import { Hono } from "hono";
import { recordEvent, seedProgress } from "../services/progress.js";
import { requireUserId } from "../session.js";

export const progress = new Hono();

/** The browser reports what happened; the server decides what it's worth. */
progress.post("/progress/events", async (c) => {
  const userId = await requireUserId(c);
  const event = progressEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!event.success) return c.json({ error: "Invalid event", issues: event.error.issues.slice(0, 5) }, 400);
  return c.json(await recordEvent(userId, event.data));
});

progress.post("/progress/seed", async (c) => {
  const userId = await requireUserId(c);
  const seed = progressSeedSchema.safeParse(await c.req.json().catch(() => null));
  if (!seed.success) return c.json({ error: "Invalid progress", issues: seed.error.issues.slice(0, 5) }, 400);
  const saved = await seedProgress(userId, seed.data);
  return saved ? c.json(saved) : c.json({ error: "Account already has progress" }, 409);
});
