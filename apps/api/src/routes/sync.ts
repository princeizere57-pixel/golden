import { LIST_SCHEMAS, isListName } from "@golden/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getProgress } from "../services/progress.js";
import { readLists, replaceList } from "../services/lists.js";
import { requireUserId } from "../session.js";

export const sync = new Hono();

/** Everything a device needs to catch up with the account, in one call. */
sync.get("/sync", async (c) => {
  const userId = await requireUserId(c);
  const [lists, progress] = await Promise.all([readLists(userId), getProgress(userId)]);
  return c.json({ userId, lists, progress });
});

/** Replace one list with the device's copy (last write wins). */
sync.put("/lists/:name", bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ error: "List too large" }, 413) }), async (c) => {
  const userId = await requireUserId(c);
  const name = c.req.param("name");
  if (!isListName(name)) return c.json({ error: "Unknown list" }, 404);
  const parsed = LIST_SCHEMAS[name].safeParse(await c.req.json().catch(() => undefined));
  if (!parsed.success) return c.json({ error: "Invalid list", issues: parsed.error.issues.slice(0, 5) }, 400);
  await replaceList(userId, name, parsed.data);
  return c.json({ ok: true });
});
