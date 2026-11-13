// Zod schemas for domain values that cross the API boundary. Derived from ./types so they
// can't drift — the `satisfies` guard fails typecheck if a schema stops matching its type.
// Endpoint request/response DTOs are composed from these as routes are added (A1/D2+).
// Relative imports carry .js so the API can load this package under Node ESM at runtime.
import { z } from "zod";
import { SKILL_LEVELS, type Ingredient } from "./types.js";

export const skillLevelSchema = z.enum(SKILL_LEVELS);
export const planSchema = z.enum(["free", "premium"]);
export const billingEntitySchema = z.enum(["us", "uk"]);

export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.enum(["g", "ml", "tsp", "tbsp", "cup", "pc", "pinch"]),
  prep: z.string().optional(),
  raw: z.string().optional(),
  icon: z.string().optional(),
}) satisfies z.ZodType<Ingredient>;

/** Onboarding answers that shape the feed (ranges match the onboarding clamps). */
export const prefsSchema = z.object({
  serves: z.number().int().min(1).max(12),
  weeknightMinutes: z.number().int().min(10).max(240),
  goals: z.array(z.string().max(60)).max(8),
});
export type Prefs = z.infer<typeof prefsSchema>;

/** A user's profile: GET/PUT /profile body. */
export const profileSchema = z.object({ skill: skillLevelSchema, prefs: prefsSchema });
export type Profile = z.infer<typeof profileSchema>;
