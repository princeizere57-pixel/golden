// Keeps this device's lists and progress in step with the signed-in account. Reads stay on the
// device (instant, and it works offline); every change is pushed to the API, and each page load
// pulls the account's copy. Signed out, nothing leaves the device. Client-side only.

import { LIST_KEYS, normalizeProgress, type ListName } from "@/lib/types";

/** Fired on every store write; useStore re-reads on it. */
export const STORE_EVENT = "bac-store";

const PROGRESS_KEY = "bac-progress";
// Which account this device's copy belongs to, so one person's lists never seed another's.
const OWNER_KEY = "bac-sync-owner";
// Lists changed on this device that the account hasn't confirmed yet: a pull must not overwrite them.
const DIRTY_KEY = "bac-sync-dirty";
// XP events the account hasn't received yet (offline / server error), replayed after the next pull.
const QUEUE_KEY = "bac-progress-queue";
const QUEUE_MAX = 20;
const NAME_FOR_KEY = Object.fromEntries(Object.entries(LIST_KEYS).map(([name, key]) => [key, name])) as Record<string, ListName>;
const JSON_HEADERS = { "content-type": "application/json" };

/** The signed-in user once pulled; until then (or signed out) changes stay on the device. */
let owner: string | null = null;
let pulling: Promise<void> | null = null;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

const notify = () => window.dispatchEvent(new Event(STORE_EVENT));
const readRaw = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
};
const writeRaw = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the account copy is still safe on the server.
  }
};
const isEmpty = (v: unknown) => v === null || v === undefined || (Array.isArray(v) && v.length === 0);

export type SyncDecision = "same" | "adopt" | "wipe";
/**
 * same: this device already belongs to the user, the account copy wins.
 * adopt: guest data (never synced) — upload whatever the account doesn't have yet.
 * wipe: it belongs to someone else — clear it first so nothing crosses accounts.
 */
export const syncDecision = (deviceOwner: string | null, userId: string): SyncDecision => (deviceOwner === null ? "adopt" : deviceOwner === userId ? "same" : "wipe");

/**
 * What a pull does with one list. "push": keep the device copy and send it (guest data the account
 * lacks, or an unconfirmed change on this device); otherwise the account copy wins.
 */
export function listAction(decision: SyncDecision, server: unknown, device: unknown, dirty: boolean): "push" | "take-server" | "remove" {
  if (decision === "adopt" && isEmpty(server) && !isEmpty(device)) return "push";
  if (decision === "same" && dirty && device !== null) return "push";
  return server === null || server === undefined ? "remove" : "take-server";
}

const dirtyKeys = () => new Set((readRaw(DIRTY_KEY) as string[] | null) ?? []);
function setDirty(key: string, dirty: boolean) {
  const keys = dirtyKeys();
  if (dirty === keys.has(key)) return;
  if (dirty) keys.add(key);
  else keys.delete(key);
  writeRaw(DIRTY_KEY, [...keys]);
}

/** Sends a list to the account shortly after it changes (rapid taps become one request). */
export function schedulePush(key: string) {
  const name = NAME_FOR_KEY[key];
  if (!name) return;
  // Marked before sending (and before the first pull), so a closed tab or failed push isn't overwritten later.
  setDirty(key, true);
  if (!owner) return;
  clearTimeout(pending.get(key));
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      const value = readRaw(key) ?? (name === "feedback" ? null : []);
      if (value === null) return;
      void fetch(`/api/lists/${name}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(value) })
        .then((r) => {
          if (r.ok) setDirty(key, false);
          else console.warn(`[sync] ${name} not saved to your account yet (${r.status}); retried on the next visit`);
        })
        .catch(() => console.warn(`[sync] ${name} not saved to your account yet (offline); retried on the next visit`));
    }, 800),
  );
}

/** XP is the server's call: it applies the same rules and its answer replaces the device's guess. */
export function sendProgressEvent(event: unknown) {
  if (!owner) return queueEvent(event); // sent after the pull
  void postEvent(event).then((sent) => sent || queueEvent(event));
}

/** True once the account has it (or rejected it as invalid, which a retry won't fix). */
async function postEvent(event: unknown): Promise<boolean> {
  const r = await fetch("/api/progress/events", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(event) }).catch(() => null);
  if (!r || r.status === 429 || r.status >= 500) return false;
  if (r.ok) {
    writeRaw(PROGRESS_KEY, await r.json());
    notify();
  }
  return true;
}

function queueEvent(event: unknown) {
  const queue = ((readRaw(QUEUE_KEY) as unknown[] | null) ?? []).concat([event]);
  writeRaw(QUEUE_KEY, queue.slice(-QUEUE_MAX));
}

async function replayEvents() {
  const queue = (readRaw(QUEUE_KEY) as unknown[] | null) ?? [];
  while (queue.length && (await postEvent(queue[0]))) {
    queue.shift();
    writeRaw(QUEUE_KEY, queue);
  }
}

// Old device logs may hold images the server won't accept (it only takes site paths and https).
function seedable(raw: unknown) {
  const p = normalizeProgress(raw);
  const ok = (s?: string) => !s || s.startsWith("/") || s.startsWith("https://");
  return { ...p, log: p.log.map(({ image, ...e }) => (ok(image) ? { ...e, ...(image ? { image } : {}) } : e)) };
}

/** Catch up with the account. Safe to call often: one pull runs at a time. */
export function pull(): Promise<void> {
  return (pulling ??= doPull().finally(() => (pulling = null)));
}

async function doPull() {
  const res = await fetch("/api/sync", { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return; // signed out or offline: this device stays local
  const data = (await res.json()) as { userId: string; lists: Record<ListName, unknown>; progress: unknown };
  const decision = syncDecision(localStorage.getItem(OWNER_KEY), data.userId);
  if (decision === "wipe") for (const key of [...Object.values(LIST_KEYS), PROGRESS_KEY, DIRTY_KEY, QUEUE_KEY]) localStorage.removeItem(key);

  const seed: string[] = [];
  const dirty = dirtyKeys();
  for (const [name, key] of Object.entries(LIST_KEYS) as [ListName, string][]) {
    const server = data.lists[name];
    const action = listAction(decision, server, readRaw(key), dirty.has(key));
    if (action === "push") seed.push(key);
    else {
      setDirty(key, false);
      if (action === "remove") localStorage.removeItem(key);
      else writeRaw(key, server);
    }
  }

  const seedProgress = !data.progress && decision === "adopt" && readRaw(PROGRESS_KEY) !== null;
  // The seed already carries everything the queued events did on this device.
  if (seedProgress) localStorage.removeItem(QUEUE_KEY);
  if (data.progress) writeRaw(PROGRESS_KEY, data.progress);
  else if (!seedProgress) localStorage.removeItem(PROGRESS_KEY);

  localStorage.setItem(OWNER_KEY, data.userId);
  owner = data.userId;
  notify();
  for (const key of seed) schedulePush(key);
  if (seedProgress) {
    const saved = await fetch("/api/progress/seed", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(seedable(readRaw(PROGRESS_KEY))) }).catch(() => null);
    if (saved?.ok) {
      writeRaw(PROGRESS_KEY, await saved.json());
      notify();
    }
  }
  await replayEvents();
}
