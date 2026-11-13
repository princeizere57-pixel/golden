import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../env";
import * as schema from "./schema";

// neon-http: one round-trip per query, ideal for Vercel serverless. Switch a call site to the
// Pool/websocket driver only if it needs interactive multi-statement transactions.
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
