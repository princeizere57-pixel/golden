import { profileSchema } from "@golden/shared";
import { Hono } from "hono";
import { getProfile, saveProfile } from "../services/profile.js";
import { requireUserId } from "../session.js";

export const profile = new Hono();

profile.get("/profile", async (c) => {
  const found = await getProfile(await requireUserId(c));
  return found ? c.json(found) : c.json({ error: "No profile yet" }, 404);
});

profile.put("/profile", async (c) => {
  const userId = await requireUserId(c);
  const body = profileSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid profile", issues: body.error.issues }, 400);
  return c.json(await saveProfile(userId, body.data));
});
