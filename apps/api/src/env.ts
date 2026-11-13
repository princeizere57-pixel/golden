import { z } from "zod";

// DATABASE_URL is optional here so a missing value can't crash the whole function at import
// (an opaque 500). getDb() throws a clear error on use instead, and /health reports it.
const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  // Browser origin allowed to call the API with credentials. Set in prod; dev falls back below.
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
