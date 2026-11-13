import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Loads apps/api/.env (DATABASE_URL) for the drizzle-kit CLI.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
