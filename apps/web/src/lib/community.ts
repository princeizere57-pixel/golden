// "Apprentice Meets Master": cooks share dishes, ask for help, and higher levels reply.
// Stored in Supabase (`community_posts`, `community_replies`), written by the server. Server-only.

import "server-only";
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
  user_id: string;
  name: string;
  level: SkillLevel;
  dish: string;
  note: string;
  asks_for_help: boolean;
  created_at: string;
  community_replies: Reply[];
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } } : null;
}

/** Latest posts with their replies. `null` means the community tables aren't set up yet. */
export async function listPosts(limit = 30): Promise<Post[] | null> {
  const d = db();
  if (!d) return null;
  try {
    const res = await fetch(
      `${d.url}/rest/v1/community_posts?select=*,community_replies(id,name,level,body,created_at)&order=created_at.desc&limit=${limit}&community_replies.order=created_at.asc`,
      { headers: d.headers, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as Post[];
  } catch {
    return null;
  }
}

export async function insert(table: "community_posts" | "community_replies", row: Record<string, unknown>): Promise<boolean> {
  const d = db();
  if (!d) return false;
  const res = await fetch(`${d.url}/rest/v1/${table}`, { method: "POST", headers: { ...d.headers, Prefer: "return=minimal" }, body: JSON.stringify(row) }).catch(() => null);
  return Boolean(res?.ok);
}

/** Keeps posts short, plain text and on topic. */
export const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");
