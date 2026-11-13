"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/billing/entitlements";
import { clean, send } from "@/lib/community";
import { getViewer } from "@/lib/viewer";

// The paid-plan gate stays here: plans still live in Supabase until P4, so the API trusts this check.
async function allowed() {
  if (!(await getUser())) return false;
  return can((await getViewer()).tier, "community");
}

export async function createPost(form: FormData) {
  if (!(await allowed())) return;
  const dish = clean(form.get("dish"), 80);
  const note = clean(form.get("note"), 500);
  if (dish.length < 2 || note.length < 2) return;
  if (await send("/community/posts", { dish, note, asksForHelp: form.get("help") === "on" })) revalidatePath("/community");
}

export async function createReply(postId: string, form: FormData) {
  if (!/^[0-9a-f-]{36}$/.test(postId) || !(await allowed())) return;
  const body = clean(form.get("body"), 500);
  if (body.length < 2) return;
  if (await send(`/community/posts/${postId}/replies`, { body })) revalidatePath("/community");
}
