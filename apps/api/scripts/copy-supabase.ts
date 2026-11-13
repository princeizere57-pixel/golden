// One-time copy of Supabase community posts/replies and feedback into Neon. Safe to re-run:
// rows whose id already exists are skipped. Old Supabase accounts aren't ours, so user_id → null
// (names, levels and text are kept). Run from apps/api: pnpm exec tsx scripts/copy-supabase.ts
import "dotenv/config";
import { inArray, sql } from "drizzle-orm";
import { getDb } from "../src/db/client.js";
import { communityPosts, communityReplies, feedback } from "../src/db/schema.js";

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to apps/api/.env first.");
  process.exit(1);
}

async function rows<T>(table: string): Promise<T[]> {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.asc&limit=100000`, { headers: { apikey: key!, Authorization: `Bearer ${key}` } });
  if (res.status === 404) return []; // never created on that project
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T[];
}

const chunks = <T>(items: T[], size = 500) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

type PostRow = { id: string; name: string; level: string; dish: string; note: string; asks_for_help: boolean; created_at: string };
type ReplyRow = { id: string; post_id: string; name: string; level: string; body: string; created_at: string };
type FeedbackRow = { id: number; rating: number; message: string | null; meals_finished: number | null; created_at: string };

const db = getDb();
const [posts, replies, notes] = await Promise.all([rows<PostRow>("community_posts"), rows<ReplyRow>("community_replies"), rows<FeedbackRow>("feedback")]);
console.log(`Supabase: ${posts.length} posts, ${replies.length} replies, ${notes.length} feedback rows`);

for (const batch of chunks(posts)) {
  await db
    .insert(communityPosts)
    .values(batch.map((p) => ({ id: p.id, userId: null, name: p.name, level: p.level, dish: p.dish, note: p.note, asksForHelp: p.asks_for_help, createdAt: new Date(p.created_at) })))
    .onConflictDoNothing();
}

// Replies only for posts that made it across (the foreign key would reject the rest).
const known = new Set<string>();
for (const batch of chunks(posts.map((p) => p.id))) for (const r of await db.select({ id: communityPosts.id }).from(communityPosts).where(inArray(communityPosts.id, batch))) known.add(r.id);
const keptReplies = replies.filter((r) => known.has(r.post_id));
for (const batch of chunks(keptReplies)) {
  await db
    .insert(communityReplies)
    .values(batch.map((r) => ({ id: r.id, postId: r.post_id, userId: null, name: r.name, level: r.level, body: r.body, createdAt: new Date(r.created_at) })))
    .onConflictDoNothing();
}

for (const batch of chunks(notes)) {
  await db
    .insert(feedback)
    .values(batch.map((f) => ({ id: f.id, userId: null, rating: f.rating, message: f.message, mealsFinished: f.meals_finished, createdAt: new Date(f.created_at) })))
    .onConflictDoNothing();
}
// Copied ids came from Supabase's sequence; move ours past them so new feedback doesn't collide.
await db.execute(sql`select setval(pg_get_serial_sequence('feedback', 'id'), greatest((select coalesce(max(id), 0) from feedback), 1))`);

const [p, r, f] = await db.batch([db.select({ n: sql<number>`count(*)::int` }).from(communityPosts), db.select({ n: sql<number>`count(*)::int` }).from(communityReplies), db.select({ n: sql<number>`count(*)::int` }).from(feedback)]);
console.log(`Neon now: ${p[0].n} posts, ${r[0].n} replies, ${f[0].n} feedback rows (skipped ${replies.length - keptReplies.length} orphan replies)`);
