import type { Profile } from "@golden/shared";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { profiles } from "../db/schema.js";

export async function getProfile(userId: string): Promise<Profile | null> {
  const [row] = await getDb().select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return row ? { skill: row.skillLevel as Profile["skill"], prefs: row.prefs } : null;
}

/** Create or replace the user's profile. */
export async function saveProfile(userId: string, profile: Profile): Promise<Profile> {
  const values = { skillLevel: profile.skill, prefs: profile.prefs, updatedAt: new Date() };
  await getDb()
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profiles.userId, set: values });
  return profile;
}
