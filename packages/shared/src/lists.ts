// The device lists that sync to the account, with the server's limits. A list is always sent and
// stored whole (last write wins), so each schema validates the full array.

import { z } from "zod";

const href = z.string().max(300).regex(/^\//, "internal link");
const slug = z.string().min(1).max(120);
const image = z.string().max(1000).refine((s) => s.startsWith("/") || s.startsWith("https://"), "site path or https URL");
const unique = <T>(items: T[]) => [...new Set(items)];

export const savedListSchema = z
  .array(z.object({ slug, href, title: z.string().max(200), image: image.optional(), minutes: z.number().int().min(0).max(100_000) }))
  .max(500);
export type SavedRecipe = z.infer<typeof savedListSchema>[number];

export const shoppingListSchema = z
  .array(z.object({ id: z.string().min(1).max(200), text: z.string().max(300), recipeTitle: z.string().max(200), href, done: z.boolean() }))
  .max(500);
export type ShoppingItem = z.infer<typeof shoppingListSchema>[number];

/** Same normalisation as the device: trimmed, lower-case, ≤40 chars, no blanks or repeats. */
export const pantryListSchema = z
  .array(z.string())
  .max(300)
  .transform((items) => unique(items.map((s) => s.trim().toLowerCase().slice(0, 40)).filter(Boolean)));

export const planDoneListSchema = z.array(slug).max(50).transform(unique);

export const timersListSchema = z
  .array(z.object({ id: z.string().min(1).max(200), label: z.string().max(200), recipeSlug: slug, endsAt: z.number().int().positive() }))
  .max(20);
export type TimerItem = z.infer<typeof timersListSchema>[number];

/** Private imports: full recipes, credited to their source; only external https photos. */
export const importsListSchema = z
  .array(
    z
      .object({
        slug: z.string().regex(/^my-[a-z0-9-]{1,40}$/),
        title: z.string().min(1).max(200),
        image: z.string().max(1000).startsWith("https://").optional(),
        source: z.object({ url: z.string().url().max(2000), name: z.string().max(200) }).optional(),
      })
      .passthrough(),
  )
  .max(50);

export const feedbackMemorySchema = z.object({ sent: z.boolean(), skippedAt: z.number().int().min(0).max(100_000).nullable() });

export const LIST_SCHEMAS = {
  saved: savedListSchema,
  shopping: shoppingListSchema,
  pantry: pantryListSchema,
  planDone: planDoneListSchema,
  timers: timersListSchema,
  imports: importsListSchema,
  feedback: feedbackMemorySchema,
} as const;
export type ListName = keyof typeof LIST_SCHEMAS;
export const isListName = (name: string): name is ListName => Object.hasOwn(LIST_SCHEMAS, name);

/** Device storage key for each synced list. */
export const LIST_KEYS: Record<ListName, string> = {
  saved: "bac-saved",
  shopping: "bac-shopping",
  pantry: "bac-pantry",
  planDone: "bac-plan-done",
  timers: "bac-timers",
  imports: "bac-imports",
  feedback: "bac-feedback",
};

// Community: what a cook may post. Whitespace collapsed, cut to length, then a minimum checked.
const text = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim().slice(0, max))
    .pipe(z.string().min(min));
export const communityPostSchema = z.object({ dish: text(2, 80), note: text(2, 500), asksForHelp: z.boolean().default(false) });
export const communityReplySchema = z.object({ body: text(2, 500) });

export const feedbackPostSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().max(10_000).optional(),
  mealsFinished: z.number().int().min(0).max(100_000).optional(),
});
