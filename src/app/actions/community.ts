"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { clean, insert } from "@/lib/community";
import { getViewer } from "@/lib/viewer";

export async function createPost(form: FormData) {
  const user = await getUser();
  if (!user) return;
  const { skill } = await getViewer();
  const dish = clean(form.get("dish"), 80);
  const note = clean(form.get("note"), 500);
  if (dish.length < 2 || note.length < 2) return;
  await insert("community_posts", { user_id: user.id, name: user.name.split(" ")[0], level: skill, dish, note, asks_for_help: form.get("help") === "on" });
  revalidatePath("/community");
}

export async function createReply(postId: string, form: FormData) {
  const user = await getUser();
  if (!user || !/^[0-9a-f-]{36}$/.test(postId)) return;
  const { skill } = await getViewer();
  const body = clean(form.get("body"), 500);
  if (body.length < 2) return;
  await insert("community_replies", { post_id: postId, user_id: user.id, name: user.name.split(" ")[0], level: skill, body });
  revalidatePath("/community");
}
