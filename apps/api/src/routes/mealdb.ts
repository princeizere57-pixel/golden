import { timingSafeEqual } from "node:crypto";
import { Hono, type Context } from "hono";
import { env } from "../env.js";
import { getMeal, listMeals, mealCategories, syncMealDb } from "../services/mealdb.js";
import { isInternal } from "../session.js";

export const mealdb = new Hono();

// Public data (credited to TheMealDB on every page that shows it).
mealdb.get("/mealdb/meals", async (c) => {
  const q = c.req.query("q")?.trim().slice(0, 80) || undefined;
  const category = c.req.query("category")?.trim().slice(0, 60) || undefined;
  const limit = Number(c.req.query("limit")) || undefined;
  return c.json({ meals: await listMeals({ q, category, limit: limit && Math.min(limit, 1000) }) });
});

mealdb.get("/mealdb/meals/:id", async (c) => {
  const id = c.req.param("id");
  const meal = /^\d{1,10}$/.test(id) ? await getMeal(id) : null;
  return meal ? c.json(meal) : c.json({ error: "Not Found" }, 404);
});

mealdb.get("/mealdb/categories", async (c) => c.json({ categories: await mealCategories() }));

/** Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; we can also run it with the internal key. */
function isCron(c: Context): boolean {
  const secret = env.CRON_SECRET;
  const sent = c.req.header("authorization")?.replace(/^Bearer /, "");
  if (!secret || secret.length < 16 || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

mealdb.get("/cron/mealdb", async (c) => {
  if (!isCron(c) && !isInternal(c)) return c.json({ error: "Forbidden" }, 403);
  const result = await syncMealDb(env.MEALDB_API_KEY);
  console.log("[cron/mealdb]", result);
  return c.json(result, result.ok ? 200 : 503);
});
