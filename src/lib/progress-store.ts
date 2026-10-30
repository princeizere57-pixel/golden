// Mini You, XP, streak and the kitchen log, kept on this device. Client-side only.

import { STORE_EVENT } from "@/lib/device-store";
import { XP, dayKey, nextStreak, rankFor, type Mood } from "@/lib/gamify";

export interface Avatar {
  skin: string;
  hair: string;
  hairStyle: "short" | "curly" | "long" | "none";
  beard: boolean;
  glasses: boolean;
  /** Small JPEG data URL of the uploaded profile photo. */
  photo?: string;
}

export type LogKind = "cooked" | "mistake" | "fixed" | "rank" | "saved" | "listed" | "quiz";

export interface LogEntry {
  id: string;
  kind: LogKind;
  title: string;
  detail: string;
  image?: string;
  at: number;
}

export interface Progress {
  xp: number;
  streak: number;
  lastCookDay: string | null;
  dishes: number;
  mood?: { state: Mood; at: number };
  log: LogEntry[];
  avatar: Avatar;
}

export const DEFAULT_AVATAR: Avatar = { skin: "#e0ac83", hair: "#3b2a20", hairStyle: "short", beard: false, glasses: false };

const KEY = "bac-progress";
const EMPTY: Progress = { xp: 0, streak: 0, lastCookDay: null, dishes: 0, log: [], avatar: DEFAULT_AVATAR };

export function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return value ? { ...EMPTY, ...value, avatar: { ...DEFAULT_AVATAR, ...value.avatar } } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, log: p.log.slice(0, 60) }));
  } catch {
    // Storage full (large photo?) or blocked: keep going for this visit.
  }
  window.dispatchEvent(new Event(STORE_EVENT));
}

function entry(kind: LogKind, title: string, detail: string, image?: string): LogEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, title, detail, image, at: Date.now() };
}

/** Adds XP and logs a rank-up when it happens. Returns the updated progress. */
function addXp(p: Progress, amount: number): Progress {
  const before = rankFor(p.xp);
  const xp = p.xp + amount;
  const after = rankFor(xp);
  if (after.index > before.index) {
    return { ...p, xp, mood: { state: "proud", at: Date.now() }, log: [entry("rank", "Promoted", `you're now a ${after.title}`), ...p.log] };
  }
  return { ...p, xp };
}

export function recordCooked(title: string, image?: string): { xp: number; streak: number; rankedUp: boolean } {
  const p = readProgress();
  const today = dayKey(new Date());
  const streak = nextStreak(p.lastCookDay, p.streak, today);
  const before = rankFor(p.xp).index;
  let next: Progress = {
    ...p,
    streak,
    lastCookDay: today,
    dishes: p.dishes + 1,
    mood: { state: "happy", at: Date.now() },
    log: [entry("cooked", "Cooked", `${title} · +${XP.cooked} XP`, image), ...p.log],
  };
  next = addXp(next, XP.cooked);
  save(next);
  return { xp: XP.cooked, streak, rankedUp: rankFor(next.xp).index > before };
}

export function recordMistake(label: string, dish: string) {
  const p = readProgress();
  save({ ...p, mood: { state: "sad", at: Date.now() }, log: [entry("mistake", "Fix My Mistake", `${label.toLowerCase()} in ${dish}`), ...p.log] });
}

export function recordFixed(headline: string) {
  const p = readProgress();
  save(addXp({ ...p, mood: { state: "happy", at: Date.now() }, log: [entry("fixed", "Rescued", `${headline.toLowerCase()} · +${XP.fixed} XP`), ...p.log] }, XP.fixed));
}

export function recordActivity(kind: "saved" | "listed", title: string, detail: string, image?: string) {
  const p = readProgress();
  save({ ...p, log: [entry(kind, title, detail, image), ...p.log] });
}

export function setMood(state: Mood) {
  save({ ...readProgress(), mood: { state, at: Date.now() } });
}

export function updateAvatar(change: Partial<Avatar>) {
  const p = readProgress();
  save({ ...p, avatar: { ...p.avatar, ...change } });
}
