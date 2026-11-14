import { MISTAKES, fixMistake, skillLevelSchema, type Recipe } from "@golden/shared";
import { can } from "@golden/shared/billing";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { accessForUser } from "../services/billing/store.js";
import { adaptWithAi, diagnosePhoto, fixTip, geminiConfigured } from "../services/ai.js";
import { requireUserId } from "../session.js";

export const ai = new Hono();

const tooLarge = (c: Context) => c.json({ error: "Too large" }, 413);
const fixMyMistake = async (c: Context) => can((await accessForUser(await requireUserId(c))).tier, "fixMyMistake");

// The posted recipe is untrusted: only its shape matters (the rewrite goes back to the same caller).
// shortcut: trusts the posted recipe (size-capped, signed-in only); resolve it by slug here if abuse shows up.
const isRecipe = (r: unknown): r is Recipe => {
  const x = r as Recipe | null;
  return (
    typeof x?.slug === "string" &&
    typeof x.title === "string" &&
    Array.isArray(x.ingredients) &&
    Array.isArray(x.blocks) &&
    x.blocks.length > 0 &&
    x.blocks.length <= 60 &&
    x.blocks.every((b) => typeof b?.id === "string" && typeof b.kind === "string" && typeof b.text === "string")
  );
};

ai.get("/ai", (c) => c.json({ ready: geminiConfigured() }));

/** The recipe's steps rewritten for a level by Gemini, or null (the web then keeps its engine version). */
ai.post("/ai/adapt", bodyLimit({ maxSize: 256 * 1024, onError: tooLarge }), async (c) => {
  await requireUserId(c);
  const body = (await c.req.json().catch(() => null)) as { recipe?: unknown; skill?: unknown } | null;
  if (!isRecipe(body?.recipe)) return c.json({ error: "Invalid recipe" }, 400);
  const skill = skillLevelSchema.catch("beginner").parse(body.skill);
  return c.json({ adapted: await adaptWithAi(body.recipe, skill) });
});

/** One extra AI tip for a Fix My Mistake rescue (Executive feature). */
ai.post("/ai/fix-tip", async (c) => {
  if (!(await fixMyMistake(c))) return c.json({ error: "Fix My Mistake is on Executive" }, 403);
  const body = (await c.req.json().catch(() => null)) as { title?: unknown; mistake?: unknown; volumeMl?: unknown; severity?: unknown } | null;
  const mistake = MISTAKES.find((m) => m.id === body?.mistake)?.id;
  const volumeMl = Number(body?.volumeMl);
  const severity = [1, 2, 3].includes(body?.severity as number) ? (body?.severity as 1 | 2 | 3) : 2;
  if (!mistake || typeof body?.title !== "string" || !Number.isFinite(volumeMl)) return c.json({ error: "Invalid request" }, 400);
  const fix = fixMistake(mistake, { volumeMl: Math.min(volumeMl, 20_000), severity });
  return c.json({ tip: await fixTip(body.title.slice(0, 120), fix) });
});

/** Photo diagnosis: the closest problem from our catalogue (Executive feature). */
ai.post("/ai/diagnose", bodyLimit({ maxSize: 2 * 1024 * 1024, onError: tooLarge }), async (c) => {
  if (!(await fixMyMistake(c))) return c.json({ error: "Fix My Mistake is on Executive" }, 403);
  const body = (await c.req.json().catch(() => null)) as { photo?: unknown; dish?: unknown } | null;
  if (typeof body?.photo !== "string" || body.photo.length > 1_500_000) return c.json({ ok: false, reason: "failed" });
  return c.json(await diagnosePhoto(body.photo, String(body.dish ?? "").slice(0, 80)));
});
