import { DAILY_CAPS, EMPTY_PROGRESS, LOG_LIMIT, applyEvent, normalizeProgress, trustedToday, type LogEntry, type LogKind, type Progress, type ProgressEvent } from "@golden/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { kitchenLog, progress } from "../db/schema.js";

async function load(userId: string) {
  const db = getDb();
  const [rows, log] = await db.batch([
    db.select().from(progress).where(eq(progress.userId, userId)).limit(1),
    db.select().from(kitchenLog).where(eq(kitchenLog.userId, userId)).orderBy(desc(kitchenLog.at)).limit(LOG_LIMIT),
  ]);
  const row = rows[0];
  if (!row) return null;
  const entries: LogEntry[] = log.map((r) => ({ id: r.entryId, kind: r.kind as LogKind, title: r.title, detail: r.detail, ...(r.image ? { image: r.image } : {}), at: r.at }));
  return { row, progress: normalizeProgress({ xp: row.xp, streak: row.streak, lastCookDay: row.lastCookDay, dishes: row.dishes, mood: row.mood ?? undefined, avatar: row.avatar, log: entries }) };
}

type Caps = { capDay: string | null; cookedToday: number; fixedToday: number };

async function save(userId: string, p: Progress, added: LogEntry[], caps: Caps) {
  const db = getDb();
  const values = { xp: p.xp, streak: p.streak, lastCookDay: p.lastCookDay, dishes: p.dishes, mood: p.mood ?? null, avatar: p.avatar, ...caps, updatedAt: new Date() };
  const upsert = db.insert(progress).values({ userId, ...values }).onConflictDoUpdate({ target: progress.userId, set: values });
  if (!added.length) return void (await upsert);
  const fresh = [...new Map(added.map((e) => [e.id, e])).values()];
  await db.batch([
    upsert,
    db
      .insert(kitchenLog)
      .values(fresh.map((e) => ({ userId, entryId: e.id, kind: e.kind, title: e.title, detail: e.detail, image: e.image ?? null, at: e.at })))
      .onConflictDoNothing(),
    // Keep only the newest LOG_LIMIT entries, like the device always did.
    db
      .delete(kitchenLog)
      .where(and(eq(kitchenLog.userId, userId), sql`${kitchenLog.entryId} not in (select entry_id from kitchen_log where user_id = ${userId} order by at desc limit ${LOG_LIMIT})`)),
  ]);
}

export const getProgress = async (userId: string) => (await load(userId))?.progress ?? null;

/** Applies one event with the server's rules. XP amounts are fixed here and capped per UTC day. */
export async function recordEvent(userId: string, event: ProgressEvent): Promise<Progress> {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const loaded = await load(userId);
  const current = loaded?.progress ?? EMPTY_PROGRESS;
  const sameDay = loaded?.row.capDay === day;
  let cooked = sameDay ? loaded.row.cookedToday : 0;
  let fixed = sameDay ? loaded.row.fixedToday : 0;
  if ((event.type === "cooked" && cooked >= DAILY_CAPS.cooked) || (event.type === "fixed" && fixed >= DAILY_CAPS.fixed)) return current;
  if (event.type === "cooked") cooked += 1;
  if (event.type === "fixed") fixed += 1;
  const today = event.type === "cooked" ? trustedToday(event.today, now) : day;
  const { progress: next, added } = applyEvent(current, event, { now, today, newId: () => crypto.randomUUID() });
  await save(userId, next, added, { capDay: day, cookedToday: cooked, fixedToday: fixed });
  return next;
}

/**
 * First sign-in only: adopt the device's progress when the account has none.
 * shortcut: trusts the device once (within schema caps); fine pre-launch, revisit if XP ever gains value.
 */
export async function seedProgress(userId: string, seed: unknown): Promise<Progress | null> {
  if (await load(userId)) return null;
  const p = normalizeProgress(seed);
  await save(userId, p, p.log, { capDay: null, cookedToday: 0, fixedToday: 0 });
  return p;
}
