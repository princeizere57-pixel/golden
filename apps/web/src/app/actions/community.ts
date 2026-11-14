"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/billing/entitlements";
import { clean, send } from "@/lib/community";
import { getViewer } from "@/lib/viewer";

// Early out for a nicer page; the API enforces the plan itself.
async function allowed() {
  if (!(await getUser())) return false;
  return can((await getViewer()).tier, "community");
}

export async function createPost(form: FormData) {
  if (!(await allowed())) return;
  const dish = clean(form.get("dish"), 80);
  const note = clean(form.get("note"), 500);
  if (dish.length < 2 || note.length < 2) return;
  done(await send("/community/posts", { dish, note, asksForHelp: form.get("help") === "on" }));
}

export async function createReply(postId: string, form: FormData) {
  if (!/^[0-9a-f-]{36}$/.test(postId) || !(await allowed())) return;
  const body = clean(form.get("body"), 500);
  if (body.length < 2) return;
  done(await send(`/community/posts/${postId}/replies`, { body }));
}

// A failed save says so on the page instead of looking like it worked.
function done(result: "ok" | "slow" | "failed") {
  if (result !== "ok") redirect(`/community?error=${result}`);
  revalidatePath("/community");
}
