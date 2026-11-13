import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../env";
import * as schema from "./schema";

// Lazy so a missing/invalid DATABASE_URL surfaces as a caught error at query time, not an
// import-time crash that takes the whole serverless function down.
// neon-http: one round-trip per query, ideal for Vercel serverless. Switch a call site to the
// Pool/websocket driver only if it needs interactive multi-statement transactions.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  _db ??= drizzle(neon(env.DATABASE_URL), { schema });
  return _db;
}
