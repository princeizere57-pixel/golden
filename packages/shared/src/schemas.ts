// Zod schemas for domain values that cross the API boundary. Derived from ./types so they
// can't drift — the `satisfies` guard fails typecheck if a schema stops matching its type.
// Endpoint request/response DTOs are composed from these as routes are added (A1/D2+).
import { z } from "zod";
import { SKILL_LEVELS, type Ingredient } from "./types";

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
