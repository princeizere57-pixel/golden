// Fetches one recipe page on a user's request. Guards against SSRF (no private or local
// addresses, re-checked on every redirect), caps size and time. Server-only.

import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 3;

/** True for loopback, private, link-local, CGNAT, multicast and other non-public addresses. */
export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a.startsWith("::ffff:")) return isPrivateAddress(a.slice(7));
    return a === "::" || a === "::1" || /^(fc|fd|fe[89ab]|ff)/.test(a);
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

export class ImportError extends Error {}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new ImportError("Only web links can be imported.");
  if (url.username || url.password) throw new ImportError("Links with credentials aren't allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (!addresses.length) throw new ImportError("Couldn't find that website.");
  if (addresses.some(isPrivateAddress)) throw new ImportError("That address isn't allowed.");
}

export async function fetchRecipePage(input: string, fetchImpl: typeof fetch = fetch): Promise<{ html: string; url: string }> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new ImportError("That doesn't look like a link.");
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const res = await fetchImpl(url, {
      redirect: "manual",
      headers: { "User-Agent": "TheChefsAI-PersonalImport/1.0 (+user-requested single page)", Accept: "text/html" },
      signal: AbortSignal.timeout(20_000),
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new ImportError(`The site answered ${res.status}.`);
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new ImportError("That page is too large.");
    const html = await res.text();
    if (html.length > MAX_BYTES) throw new ImportError("That page is too large.");
    return { html, url: url.toString() };
  }
  throw new ImportError("Too many redirects.");
}
