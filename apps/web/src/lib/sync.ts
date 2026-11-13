// Keeps this device's lists and progress in step with the signed-in account. Reads stay on the
// device (instant, and it works offline); every change is pushed to the API, and each page load
// pulls the account's copy. Signed out, nothing leaves the device. Client-side only.

import { LIST_KEYS, normalizeProgress, type ListName } from "@/lib/types";

/** Fired on every store write; useStore re-reads on it. */
export const STORE_EVENT = "bac-store";

const PROGRESS_KEY = "bac-progress";
// Which account this device's copy belongs to, so one person's lists never seed another's.
const OWNER_KEY = "bac-sync-owner";
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

/** Sends a list to the account shortly after it changes (rapid taps become one request). */
export function schedulePush(key: string) {
  const name = NAME_FOR_KEY[key];
  if (!owner || !name) return;
  clearTimeout(pending.get(key));
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      const value = readRaw(key) ?? (name === "feedback" ? null : []);
      if (value === null) return;
      void fetch(`/api/lists/${name}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(value) })
        .then((r) => !r.ok && console.warn(`[sync] ${name} not saved to your account (${r.status})`))
        .catch(() => console.warn(`[sync] ${name} not saved to your account (offline)`));
    }, 800),
  );
}

/** XP is the server's call: it applies the same rules and its answer replaces the device's guess. */
export function sendProgressEvent(event: unknown) {
  if (!owner) return;
  void fetch("/api/progress/events", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(event) })
    .then((r) => (r.ok ? r.json() : null))
    .then((p) => {
      if (!p) return;
      writeRaw(PROGRESS_KEY, p);
      notify();
    })
    .catch(() => {});
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
  if (decision === "wipe") for (const key of [...Object.values(LIST_KEYS), PROGRESS_KEY]) localStorage.removeItem(key);

  const seed: string[] = [];
  for (const [name, key] of Object.entries(LIST_KEYS) as [ListName, string][]) {
    const server = data.lists[name];
    if (decision === "adopt" && isEmpty(server) && !isEmpty(readRaw(key))) seed.push(key);
    else if (server === null || server === undefined) localStorage.removeItem(key);
    else writeRaw(key, server);
  }

  const seedProgress = !data.progress && decision === "adopt" && readRaw(PROGRESS_KEY) !== null;
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
}
