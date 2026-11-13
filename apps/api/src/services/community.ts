import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { communityPosts, communityReplies, profiles, user } from "../db/schema.js";

/** Latest posts with their replies, in the shape the web page renders. No user ids leave the API. */
export async function listPosts(limit: number) {
  const db = getDb();
  const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(limit);
  if (!posts.length) return [];
  const replies = await db
    .select()
    .from(communityReplies)
    .where(
      inArray(
        communityReplies.postId,
        posts.map((p) => p.id),
      ),
    )
    .orderBy(asc(communityReplies.createdAt));
  return posts.map((p) => ({
    id: p.id,
    name: p.name,
    level: p.level,
    dish: p.dish,
    note: p.note,
    asks_for_help: p.asksForHelp,
    created_at: p.createdAt.toISOString(),
    community_replies: replies.filter((r) => r.postId === p.id).map((r) => ({ id: r.id, name: r.name, level: r.level, body: r.body, created_at: r.createdAt.toISOString() })),
  }));
}

/** Who's posting, from our own rows: first name (or the email's name part) and their level. */
async function author(userId: string) {
  const db = getDb();
  const [people, levels] = await db.batch([
    db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1),
    db.select({ level: profiles.skillLevel }).from(profiles).where(eq(profiles.userId, userId)).limit(1),
  ]);
  const person = people[0];
  const full = person?.name?.trim() || person?.email.split("@")[0] || "Cook";
  return { name: full.split(" ")[0], level: levels[0]?.level ?? "beginner" };
}

export async function createPost(userId: string, input: { dish: string; note: string; asksForHelp: boolean }) {
  await getDb()
    .insert(communityPosts)
    .values({ userId, ...(await author(userId)), ...input });
}

/** False when the post doesn't exist (any more). */
export async function createReply(userId: string, postId: string, body: string): Promise<boolean> {
  const db = getDb();
  const [post] = await db.select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!post) return false;
  await db.insert(communityReplies).values({ postId, userId, ...(await author(userId)), body });
  return true;
}
