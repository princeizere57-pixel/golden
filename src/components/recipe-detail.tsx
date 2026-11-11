"use client";

// The recipe page, laid out the way a good product page is (uxpeak's redesign lessons): a clean
// hero photo with back and save on it, a short header (category, one short badge, the title, the
// decision line), one row of matching facts, serving presets that rescale the ingredients, the
// method at the cook's level, "cook it with" pairings, and one sticky primary action.
// Used by Golden recipes, TheMealDB meals and private imports, so they all look and work alike.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { AddToListButton, useStore } from "@/components/recipe-actions";
import { unlockHref } from "@/components/plan-lock";
import { SkillSteps } from "@/components/skill-steps";
import { TimeTile } from "@/components/time-tile";
import { isSaved, toggleSaved } from "@/lib/device-store";
import { formatDuration, recipeHref, totalMinutes } from "@/lib/links";
import { recordActivity } from "@/lib/progress-store";
import { SERVING_CHOICES, formatQuantity, scaleIngredients } from "@/lib/servings";
import type { Recipe, SkillLevel } from "@/lib/types";

export interface Pairing {
  slug: string;
  title: string;
  image?: string;
  minutes: string;
  href: string;
}

/** What the cook's plan lets them do here. */
export type CookAccess = "open" | "locked-cook" | "locked-recipe";

interface Props {
  recipe: Recipe;
  skill: SkillLevel;
  /** "Easy", "Medium" or "Advanced". */
  level: string;
  activeMinutes: number;
  cookHref: string;
  planHref?: string;
  access: CookAccess;
  pairings?: Pairing[];
  /** Credit or notes under the summary (imports, TheMealDB). */
  credit?: ReactNode;
  /** Small print under the method. */
  methodNote?: string;
}

const ICON = {
  knife: <path d="M3 21 14.5 9.5m0 0L20 4l1 1-5.5 5.5M14.5 9.5l2 2" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M17.5 13.6A5.5 5.5 0 0 1 20.5 19" /></>,
  bars: <path d="M5 19v-5M12 19V9M19 19V5" />,
};

function Fact({ icon, label, value }: { icon: keyof typeof ICON; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-accent">{ICON[icon]}</svg>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

function Hero({ recipe, minutes }: { recipe: Recipe; minutes: string }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const saved = useStore(() => isSaved(recipe.slug), false);
  const owner = recipe.imageCredit ?? (recipe.image?.startsWith("http") ? recipe.source : undefined);
  const save = () => {
    if (toggleSaved({ slug: recipe.slug, href: recipeHref(recipe), title: recipe.title, image: recipe.image, minutes: totalMinutes(recipe) })) recordActivity("saved", "Saved", recipe.title, recipe.image);
  };
  const round = "flex h-11 w-11 items-center justify-center rounded-full bg-bg/90 text-ink shadow-md backdrop-blur";
  return (
    <figure className="relative">
      <div className="aspect-[4/3] overflow-hidden rounded-b-[2rem] bg-surface">
        {recipe.image && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- our own photos, or the source's own photo loaded from its URL
          <img src={recipe.image} alt={recipe.title} referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center"><TimeTile time={minutes} /></div>
        )}
      </div>
      <button type="button" onClick={() => (history.length > 1 ? router.back() : router.push("/"))} aria-label="Back" className={`absolute left-4 top-4 ${round}`}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <button type="button" onClick={save} aria-pressed={saved} aria-label={saved ? "Saved" : "Save recipe"} className={`absolute right-4 top-4 ${round}`}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden className={saved ? "text-accent" : ""}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
      </button>
      {owner && recipe.image && !failed && (
        <figcaption className="px-4 pt-1.5 text-right text-xs text-muted">
          Photo: <a href={owner.url} target="_blank" rel="noopener noreferrer" className="underline">{owner.name} ↗</a>
        </figcaption>
      )}
    </figure>
  );
}

export function RecipeDetail({ recipe, skill, level, activeMinutes, cookHref, planHref, access, pairings = [], credit, methodNote }: Props) {
  const total = totalMinutes(recipe);
  const minutes = formatDuration(total);
  const base = recipe.serves > 0 ? recipe.serves : 2;
  // Preset servings like the video's 0.5 / 1 / 2 / 3 kg: the usual four, plus the recipe's own.
  const choices = useMemo(() => [...new Set([...SERVING_CHOICES, base])].sort((a, b) => a - b), [base]);
  const [servings, setServings] = useState(base);
  const scalable = recipe.ingredients.some((i) => i.quantity > 0);
  const ingredients = useMemo(() => scaleIngredients(recipe.ingredients, base, servings), [recipe.ingredients, base, servings]);
  const scaled = useMemo(() => ({ ...recipe, ingredients }), [recipe, ingredients]);
  const badge = recipe.realTime ? "Real-time" : level;

  return (
    <main className="mx-auto max-w-xl pb-40">
      <Hero recipe={recipe} minutes={minutes} />

      <div className="px-4">
        {/* Short header: category, one short badge, the title, then what decides it */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{recipe.category}</p>
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent">{badge}</span>
        </div>
        <h1 className="mt-1 font-display text-[1.6rem] leading-tight">{recipe.title}</h1>
        <p className="mt-1 font-semibold">{level} · {minutes} · serves {servings}</p>
        {recipe.summary && <p className="mt-3 text-muted">{recipe.summary}</p>}
        {credit}

        {/* One row of matching facts */}
        <dl className="mt-6 grid grid-cols-4 gap-2 border-y border-line py-4">
          <Fact icon="knife" label="Hands-on" value={`${Math.round(activeMinutes)} min`} />
          <Fact icon="clock" label="Total" value={minutes} />
          <Fact icon="people" label="Serves" value={String(servings)} />
          <Fact icon="bars" label="Level" value={level} />
        </dl>

        {/* Ingredients with serving presets */}
        <section className="mt-7" aria-labelledby="ingredients">
          <div className="flex items-end justify-between gap-3">
            <h2 id="ingredients" className="text-xl font-semibold">Ingredients</h2>
            <span className="text-sm text-muted">for {servings}</span>
          </div>
          {scalable && (
            <div className={`mt-3 grid gap-2 ${choices.length > 4 ? "grid-cols-5" : "grid-cols-4"}`} role="radiogroup" aria-label="Servings">
              {choices.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={servings === n}
                  onClick={() => setServings(n)}
                  aria-label={`${n} ${n === 1 ? "person" : "people"}`}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 leading-tight ${servings === n ? "border-accent bg-accent-soft" : "border-line"}`}
                >
                  <span className="text-lg font-bold">{n}</span>
                  <span className="text-[11px] text-muted">{n === 1 ? "person" : "people"}</span>
                </button>
              ))}
            </div>
          )}
          <ul className="mt-3 divide-y divide-line">
            {ingredients.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-2.5 text-sm">
                <span>{i.raw && !i.quantity ? i.raw : <>{i.name}{i.prep && <span className="text-muted">, {i.prep}</span>}</>}</span>
                <span className="shrink-0 tabular-nums text-muted">{i.raw && !i.quantity ? "" : formatQuantity(i.quantity, i.unit)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex"><AddToListButton recipe={scaled} /></div>
        </section>

        {/* Method at the cook's level */}
        <section className="mt-9" aria-label="Method">
          <h2 className="text-xl font-semibold">Method</h2>
          <div className="mt-3">
            {access === "locked-recipe" ? (
              <div className="rounded-3xl bg-surface p-6">
                <p className="font-semibold">The method is part of a plan</p>
                <p className="mt-1 text-sm text-muted">Start your free days to see it at your level and cook it hands-free.</p>
              </div>
            ) : (
              <SkillSteps recipe={scaled} initialSkill={skill} />
            )}
          </div>
          {methodNote && <p className="mt-6 text-xs text-muted">{methodNote}</p>}
        </section>

        {/* Cook it with: two dishes, one timeline */}
        {pairings.length > 0 && access !== "locked-recipe" && (
          <section className="mt-10" aria-labelledby="pairings">
            <h2 id="pairings" className="text-xl font-semibold">Cook it with</h2>
            <p className="mt-1 text-sm text-muted">Pick a second dish and Golden times both to finish hot together.</p>
            <ul className="mt-3 grid grid-cols-2 gap-3">
              {pairings.slice(0, 4).map((p) => (
                <li key={p.slug}>
                  <Link href={p.href} className="block rounded-3xl border border-line p-2">
                    <span className="block aspect-square overflow-hidden rounded-2xl bg-surface">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- recipe photo
                        <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <TimeTile time={p.minutes} compact />
                      )}
                    </span>
                    <span className="mt-2 block px-1 text-sm font-semibold leading-snug">{p.title}</span>
                    <span className="block px-1 pb-1 text-xs text-muted">+ {p.minutes} · plan both</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* One sticky primary action, above the tab bar */}
      <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-20 mt-8 px-4">
        <div className="flex gap-2 rounded-full border border-line bg-bg/95 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
          {access === "open" ? (
            <>
              {planHref && <Link href={planHref} className="flex min-h-12 items-center justify-center rounded-full border-2 border-line px-4 text-sm font-semibold">Plan it</Link>}
              <Link href={cookHref} className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-button font-semibold text-button-ink">Start cook mode · {minutes}</Link>
            </>
          ) : (
            <Link href={unlockHref(access === "locked-recipe" ? "premiumRecipes" : "cookMode")} className="flex min-h-12 flex-1 flex-col items-center justify-center rounded-full bg-button font-semibold leading-tight text-button-ink">
              {access === "locked-recipe" ? "Unlock this recipe" : "Unlock cook mode"}
              <span className="text-xs font-medium">5 days free</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
