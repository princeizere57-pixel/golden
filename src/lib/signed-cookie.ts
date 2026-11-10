// Tamper-proof cookie values. The user session (bac-user) and the plan (bac-plan) decide who
// someone is and whether they get Premium, so the server signs them with an HMAC and ignores
// anything that doesn't verify: editing the cookie in the browser gets you signed out, not
// upgraded. Server-only.
//
// Secret: SESSION_SECRET (set a long random value in production). Falls back to
// SUPABASE_SERVICE_ROLE_KEY, which is already a server-only secret, and to a fixed development
// value only when neither exists (demo mode, no real accounts or payments).

import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "golden-dev-only-secret";

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (s) return s;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[session] SESSION_SECRET is not set; using the development secret");
  }
  return DEV_SECRET;
}

const mac = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/** `payload.signature`, both URL-safe. */
export function signValue(value: string): string {
  const payload = Buffer.from(value, "utf8").toString("base64url");
  return `${payload}.${mac(payload)}`;
}

/** The original value, or null if the cookie is missing, malformed or was edited. */
export function verifyValue(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(mac(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
