// App Store Server Notifications V2. The payload is a JWS signed with ES256 whose x5c header
// carries a certificate chain that must end at Apple Root CA - G3. Server-only.

import "server-only";
import { X509Certificate, createHash, verify } from "node:crypto";
import type { SubscriptionStatus } from "@/lib/billing/subscriptions";

/** SHA-256 fingerprint of Apple Root CA - G3 (override with APPLE_ROOT_CA_SHA256 if Apple rotates it). */
export const APPLE_ROOT_G3_SHA256 = "63343ABFB89A6A03EBB57E9B3F5FA7BE7C4F5C756F3017B3A8C488C3653E9179";

const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export class JwsError extends Error {}

/** Verifies a JWS from Apple and returns its decoded payload. Throws JwsError if anything is off. */
export function verifyAppleJws<T = unknown>(
  jws: string,
  { rootSha256 = process.env.APPLE_ROOT_CA_SHA256 ?? APPLE_ROOT_G3_SHA256, now = new Date() } = {},
): T {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new JwsError("Malformed JWS");
  const [h, p, s] = parts;
  let header: { alg?: string; x5c?: string[] };
  try {
    header = JSON.parse(b64url(h).toString("utf8"));
  } catch {
    throw new JwsError("Unreadable JWS header");
  }
  if (header.alg !== "ES256") throw new JwsError("Unexpected algorithm");
  if (!Array.isArray(header.x5c) || header.x5c.length < 2) throw new JwsError("Missing certificate chain");

  const chain = header.x5c.map((der) => new X509Certificate(Buffer.from(der, "base64")));
  for (const [i, cert] of chain.entries()) {
    if (now < new Date(cert.validFrom) || now > new Date(cert.validTo)) throw new JwsError("Certificate outside validity");
    const issuer = chain[i + 1];
    if (issuer && !cert.verify(issuer.publicKey)) throw new JwsError("Broken certificate chain");
  }
  const root = chain[chain.length - 1];
  const rootSha = createHash("sha256").update(root.raw).digest("hex").toUpperCase();
  if (rootSha !== rootSha256.replace(/:/g, "").toUpperCase()) throw new JwsError("Chain does not end at the Apple root");
  if (!root.verify(root.publicKey)) throw new JwsError("Root is not self-signed");

  const ok = verify("sha256", Buffer.from(`${h}.${p}`), { key: chain[0].publicKey, dsaEncoding: "ieee-p1363" }, b64url(s));
  if (!ok) throw new JwsError("Bad signature");
  return JSON.parse(b64url(p).toString("utf8")) as T;
}

/** Maps a V2 notification type to our subscription status (null = no status change). */
export function appStoreStatus(notificationType: string, subtype?: string): SubscriptionStatus | null {
  switch (notificationType) {
    case "SUBSCRIBED":
    case "DID_RENEW":
    case "OFFER_REDEEMED":
      return "active";
    case "DID_FAIL_TO_RENEW":
      return subtype === "GRACE_PERIOD" ? "grace" : "past_due";
    case "GRACE_PERIOD_EXPIRED":
      return "past_due";
    case "EXPIRED":
      return "expired";
    case "REFUND":
    case "REVOKE":
      return "revoked";
    case "DID_CHANGE_RENEWAL_STATUS":
      return subtype === "AUTO_RENEW_DISABLED" ? "canceled" : subtype === "AUTO_RENEW_ENABLED" ? "active" : null;
    default:
      return null;
  }
}
