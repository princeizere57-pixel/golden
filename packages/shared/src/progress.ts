// XP, streak, mood, avatar and the kitchen log as one pure reducer. The browser runs it for an
// instant UI and the API runs the same code on its own copy, so the server is the source of truth
// and the two can't drift. Everything here is pure: time, day and ids come in via the context.

import { z } from "zod";
import { XP, nextStreak, rankFor } from "./gamify.js";

const moodSchema = z.enum(["neutral", "happy", "proud", "sad", "focused"]);
// Own recipe photos are site paths; library/imported ones are https. Never data: URLs.
const imageUrl = z.string().max(1000).refine((s) => s.startsWith("/") || s.startsWith("https://"), "image must be a site path or https URL");
const dayKeyString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const avatarSchema = z.object({
  /** Boy or girl Mini You. The girl always has her voluminous curls. */
  figure: z.enum(["boy", "girl"]),
  skin: z.string().max(20),
  hair: z.string().max(20),
  /** Boy only. */
  hairStyle: z.enum(["short", "curly", "long", "none"]),
  /** Boy only. */
  beard: z.boolean(),
  glasses: z.boolean(),
});
export type Avatar = z.infer<typeof avatarSchema>;

export const LOG_KINDS = ["cooked", "mistake", "fixed", "rank", "saved", "listed", "quiz"] as const;
export type LogKind = (typeof LOG_KINDS)[number];

const logEntrySchema = z.object({
  id: z.string().max(100),
  kind: z.enum(LOG_KINDS),
  title: z.string().max(200),
  detail: z.string().max(300),
  image: imageUrl.optional(),
  at: z.number().int().nonnegative(),
});
export type LogEntry = z.infer<typeof logEntrySchema>;

export interface Progress {
  xp: number;
  streak: number;
  lastCookDay: string | null;
  dishes: number;
  mood?: { state: z.infer<typeof moodSchema>; at: number };
  log: LogEntry[];
  avatar: Avatar;
}

export const DEFAULT_AVATAR: Avatar = { figure: "boy", skin: "#e0ac83", hair: "#3b2a20", hairStyle: "short", beard: false, glasses: false };
export const EMPTY_PROGRESS: Progress = { xp: 0, streak: 0, lastCookDay: null, dishes: 0, log: [], avatar: DEFAULT_AVATAR };
export const LOG_LIMIT = 60;

/** XP-earning events allowed per UTC day; extra ones are ignored by the server. */
export const DAILY_CAPS = { cooked: 10, fixed: 20 } as const;

export const progressEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cooked"), title: z.string().max(200), image: imageUrl.optional(), today: dayKeyString }),
  z.object({ type: z.literal("mistake"), label: z.string().max(120), dish: z.string().max(200) }),
  z.object({ type: z.literal("fixed"), headline: z.string().max(200) }),
  z.object({ type: z.literal("activity"), kind: z.enum(["saved", "listed"]), title: z.string().max(200), detail: z.string().max(300), image: imageUrl.optional() }),
  z.object({ type: z.literal("mood"), state: moodSchema }),
  z.object({ type: z.literal("avatar"), change: avatarSchema.partial() }),
]);
export type ProgressEvent = z.infer<typeof progressEventSchema>;

/** A device's progress uploaded once, on the first sign-in, when the account has none yet. */
export const progressSeedSchema = z.object({
  xp: z.number().int().min(0).max(100_000),
  streak: z.number().int().min(0).max(3650),
  lastCookDay: dayKeyString.nullable(),
  dishes: z.number().int().min(0).max(100_000),
  mood: z.object({ state: moodSchema, at: z.number().int().nonnegative() }).optional(),
  log: z.array(logEntrySchema).max(LOG_LIMIT),
  avatar: avatarSchema,
});

const AVATAR_KEYS = Object.keys(DEFAULT_AVATAR) as (keyof Avatar)[];

/** Anything stored (device or database) back into a full Progress; unknown avatar fields dropped. */
export function normalizeProgress(value: unknown): Progress {
  if (!value || typeof value !== "object") return EMPTY_PROGRESS;
  const v = value as Partial<Progress> & { avatar?: Record<string, unknown> };
  const avatar = { ...DEFAULT_AVATAR };
  for (const k of AVATAR_KEYS) if (v.avatar?.[k] !== undefined) (avatar as Record<string, unknown>)[k] = v.avatar[k];
  return { ...EMPTY_PROGRESS, ...v, log: Array.isArray(v.log) ? v.log : [], avatar };
}

export interface ApplyContext {
  now: number;
  /** The cook's local day (YYYY-MM-DD): streaks follow their calendar, not the server's. */
  today: string;
  newId: () => string;
}

export interface Applied {
  progress: Progress;
  /** New log entries, newest first. */
  added: LogEntry[];
  xp: number;
  streak: number;
  rankedUp: boolean;
}

export function applyEvent(p: Progress, e: ProgressEvent, ctx: ApplyContext): Applied {
  let next: Progress = { ...p };
  const added: LogEntry[] = [];
  let gained = 0;
  let rankedUp = false;
  const log = (kind: LogKind, title: string, detail: string, image?: string) => {
    const entry: LogEntry = { id: ctx.newId(), kind, title, detail, ...(image ? { image } : {}), at: ctx.now };
    next = { ...next, log: [entry, ...next.log] };
    added.unshift(entry);
  };
  const addXp = (amount: number) => {
    const before = rankFor(next.xp).index;
    next = { ...next, xp: next.xp + amount };
    gained += amount;
    const after = rankFor(next.xp);
    if (after.index > before) {
      next = { ...next, mood: { state: "proud", at: ctx.now } };
      log("rank", "Promoted", `you're now a ${after.title}`);
      rankedUp = true;
    }
  };

  switch (e.type) {
    case "cooked":
      next = { ...next, streak: nextStreak(next.lastCookDay, next.streak, ctx.today), lastCookDay: ctx.today, dishes: next.dishes + 1, mood: { state: "happy", at: ctx.now } };
      log("cooked", "Cooked", `${e.title} · +${XP.cooked} XP`, e.image);
      addXp(XP.cooked);
      break;
    case "mistake":
      next = { ...next, mood: { state: "sad", at: ctx.now } };
      log("mistake", "Fix My Mistake", `${e.label.toLowerCase()} in ${e.dish}`);
      break;
    case "fixed":
      next = { ...next, mood: { state: "happy", at: ctx.now } };
      log("fixed", "Rescued", `${e.headline.toLowerCase()} · +${XP.fixed} XP`);
      addXp(XP.fixed);
      break;
    case "activity":
      log(e.kind, e.title, e.detail, e.image);
      break;
    case "mood":
      next = { ...next, mood: { state: e.state, at: ctx.now } };
      break;
    case "avatar":
      next = { ...next, avatar: { ...next.avatar, ...e.change } };
      break;
  }
  next = { ...next, log: next.log.slice(0, LOG_LIMIT) };
  return { progress: next, added, xp: gained, streak: next.streak, rankedUp };
}

/** The cook's day, trusted only within a day of the server's UTC date (every timezone fits). */
export function trustedToday(clientToday: string, now: number): string {
  const server = new Date(now).toISOString().slice(0, 10);
  const gap = Math.abs(Date.parse(`${clientToday}T00:00:00Z`) - Date.parse(`${server}T00:00:00Z`));
  return gap <= 86_400_000 ? clientToday : server;
}
