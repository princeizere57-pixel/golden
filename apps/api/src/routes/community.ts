import { communityPostSchema, communityReplySchema } from "@golden/shared";
import { can } from "@golden/shared/billing";
import { Hono } from "hono";
import { accessForUser } from "../services/billing/store.js";
import { rateLimit } from "../services/rate-limit.js";
import { createPost, createReply, listPosts } from "../services/community.js";
import { requireUserId } from "../session.js";

export const community = new Hono();

// Community is a paid feature: signed in, on a plan that includes it (from our subscriptions).
community.use("/community/*", async (c, next) => {
  if (!can((await accessForUser(await requireUserId(c))).tier, "community")) return c.json({ error: "Community is on a plan" }, 403);
  await next();
});

community.get("/community/posts", async (c) => {
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 30));
  return c.json({ posts: await listPosts(limit) });
});

community.post("/community/posts", rateLimit("post", 10), async (c) => {
  const userId = await requireUserId(c);
  const body = communityPostSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid post" }, 400);
  await createPost(userId, body.data);
  return c.json({ ok: true }, 201);
});

community.post("/community/posts/:id/replies", rateLimit("reply", 30), async (c) => {
  const userId = await requireUserId(c);
  const postId = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/.test(postId)) return c.json({ error: "Unknown post" }, 404);
  const body = communityReplySchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid reply" }, 400);
  return (await createReply(userId, postId, body.data.body)) ? c.json({ ok: true }, 201) : c.json({ error: "Unknown post" }, 404);
});
