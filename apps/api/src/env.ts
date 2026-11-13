import { z } from "zod";

// Fail loud at startup if required config is missing, rather than at the first query.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Browser origin allowed to call the API with credentials. Set in prod; dev falls back below.
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
