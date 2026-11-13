// "Apprentice Meets Master": cooks share dishes, ask for help, and higher levels reply.
// Stored by our API (community_posts / community_replies). Only this server may call those
// endpoints (INTERNAL_API_KEY), because the paid-plan check happens here. Server-only.

import "server-only";
import { apiFetch } from "@/lib/api";
import type { SkillLevel } from "@/lib/types";

export interface Reply {
  id: string;
  name: string;
  level: SkillLevel;
  body: string;
  created_at: string;
}

export interface Post {
  id: string;
  name: string;
  level: SkillLevel;
  dish: string;
  note: string;
  asks_for_help: boolean;
  created_at: string;
  community_replies: Reply[];
}

const internal = () => ({ "x-internal-key": process.env.INTERNAL_API_KEY ?? "" });

/** Latest posts with their replies. `null` means the community can't be reached right now. */
export async function listPosts(limit = 30): Promise<Post[] | null> {
  try {
    const res = await apiFetch(`/community/posts?limit=${limit}`, { headers: internal() });
    return res.ok ? ((await res.json()) as { posts: Post[] }).posts : null;
  } catch {
    return null;
  }
}

/** Posts as the signed-in user (their cookie is forwarded); the API adds their name and level. */
export async function send(path: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await apiFetch(path, { method: "POST", headers: { ...internal(), "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!res?.ok) console.error("[community] save failed", res?.status ?? "network error");
  return Boolean(res?.ok);
}

/** Keeps posts short, plain text and on topic. */
export const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");
