import "server-only";
import { headers } from "next/headers";
import { apiOrigin } from "@/lib/api-origin";

/**
 * Calls our API as the current visitor: forwards this request's cookies (the Better Auth session).
 * Paths are the API's own (e.g. "/profile", "/api/auth/get-session"), not the web proxy's.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${apiOrigin()}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), cookie: (await headers()).get("cookie") ?? "" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}
