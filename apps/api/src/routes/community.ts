import { communityPostSchema, communityReplySchema } from "@golden/shared";
import { Hono } from "hono";
import { createPost, createReply, listPosts } from "../services/community.js";
import { isInternal, requireUserId } from "../session.js";

export const community = new Hono();

// Community is a paid feature and only the web knows the plan (until P4), so only the web server
// may call these; a browser hitting them directly gets 403.
community.use("/community/*", async (c, next) => {
  if (!isInternal(c)) return c.json({ error: "Forbidden" }, 403);
  await next();
});

community.get("/community/posts", async (c) => {
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 30));
  return c.json({ posts: await listPosts(limit) });
});

community.post("/community/posts", async (c) => {
  const userId = await requireUserId(c);
  const body = communityPostSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid post" }, 400);
  await createPost(userId, body.data);
  return c.json({ ok: true }, 201);
});

community.post("/community/posts/:id/replies", async (c) => {
  const userId = await requireUserId(c);
  const postId = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/.test(postId)) return c.json({ error: "Unknown post" }, 404);
  const body = communityReplySchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid reply" }, 400);
  return (await createReply(userId, postId, body.data.body)) ? c.json({ ok: true }, 201) : c.json({ error: "Unknown post" }, 404);
});
