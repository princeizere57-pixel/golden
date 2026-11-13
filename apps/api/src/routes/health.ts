import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { getDb } from "../db/client";

// Liveness stays 200 even if the DB is down (so uptime checks don't flap); the `database`
// field reports reachability, which is what proves the Neon wiring end to end.
export const health = new Hono();

health.get("/health", async (c) => {
  let database = "up";
  try {
    await getDb().execute(sql`select 1`);
  } catch {
    database = "down";
  }
  return c.json({ status: "ok", database, time: new Date().toISOString() });
});
