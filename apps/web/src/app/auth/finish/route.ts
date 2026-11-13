// Sign-in lands here. A returning user (profile saved from any device) gets it copied onto this
// device and goes straight into the app; someone new goes through the questions.

import { NextResponse, type NextRequest } from "next/server";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { profileSchema } from "@/lib/types";
import { rememberProfile } from "@/lib/viewer";

export async function GET(req: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));
  if (!(await getUser())) return to("/signin");
  const res = await apiFetch("/profile").catch(() => null);
  const profile = res?.ok ? profileSchema.safeParse(await res.json()) : null;
  if (!profile?.success) return to("/onboarding");
  await rememberProfile(profile.data.skill, profile.data.prefs);
  return to("/");
}
