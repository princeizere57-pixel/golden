// Runs the nightly TheMealDB sync once, from this machine (same code as GET /cron/mealdb).
// Run from apps/api: pnpm exec tsx scripts/sync-mealdb.ts   (uses MEALDB_API_KEY if set)
import "dotenv/config";
import { syncMealDb } from "../src/services/mealdb.js";

// No serverless limit here, so give the full sweep time to finish.
const result = await syncMealDb(process.env.MEALDB_API_KEY, 10 * 60_000);
console.log(result);
process.exit(result.ok ? 0 : 1);
