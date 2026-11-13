"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiOrigin } from "@/lib/api-origin";
import { JOURNEY_COOKIE, SESSION_COOKIES } from "@/lib/journey";
import { PLAN_COOKIE, PREFS_COOKIE, SKILL_COOKIE } from "@/lib/viewer";

// "bac-user" was the pre-Better-Auth session cookie; still cleared so older devices drop it.
const DEVICE_COOKIES = [...SESSION_COOKIES, "bac-user", SKILL_COOKIE, PREFS_COOKIE, PLAN_COOKIE, JOURNEY_COOKIE];

/** Revokes the Better Auth session in the API, then forgets this device's app state. */
async function forget() {
  const h = await headers();
  try {
    await fetch(`${apiOrigin()}/api/auth/sign-out`, {
      method: "POST",
      // Better Auth checks Origin on POSTs; it must be this site, which is its trusted origin.
      headers: { cookie: h.get("cookie") ?? "", origin: `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`, "content-type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // API unreachable: still sign out on this device; the session row expires on its own.
  }
  // The API's Set-Cookie can't reach the browser from a server-to-server call, so clear them here.
  // A __Secure- cookie can only be overwritten with Secure set.
  const jar = await cookies();
  for (const name of DEVICE_COOKIES) jar.set(name, "", { maxAge: 0, path: "/", secure: name.startsWith("__Secure-") });
}

/** "Use a different account" on the sign-in page: forget this account and stay on sign-in. */
export async function switchAccount() {
  await forget();
  redirect("/signin");
}

export async function signOut() {
  await forget();
  redirect("/");
}
