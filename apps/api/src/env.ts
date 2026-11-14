import { z } from "zod";

// All optional so a missing value can't crash the function at import (opaque 500); the code that
// needs each one fails clearly on use. Better Auth itself throws in production if its secret is unset.
const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  // Browser origin allowed to call the API with credentials / Better Auth trusted origin.
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Shared secret for web-server-to-API calls on routes the browser must not reach directly.
  INTERNAL_API_KEY: z.string().optional(),
  // TheMealDB supporter key (nightly library sync).
  MEALDB_API_KEY: z.string().optional(),
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  CRON_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
