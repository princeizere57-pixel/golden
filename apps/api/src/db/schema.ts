import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// First table: proves migrations apply to a fresh Neon branch and gives /health a row to read
// to confirm live DB connectivity. Domain tables (auth, profiles, …) arrive in A1/D2.
export const appMeta = pgTable("app_meta", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
