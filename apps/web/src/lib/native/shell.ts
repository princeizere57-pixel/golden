// Which app shell (if any) this request comes from. Server-only; see user-agent.ts.

import "server-only";
import { headers } from "next/headers";
import { shellFromUserAgent, storeFor, type Shell, type Store } from "@/lib/native/user-agent";

export async function requestShell(): Promise<Shell> {
  return shellFromUserAgent((await headers()).get("user-agent"));
}

export async function requestStore(): Promise<Store> {
  return storeFor(await requestShell());
}
