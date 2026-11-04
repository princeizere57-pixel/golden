import type { Metadata } from "next";
import Link from "next/link";
import { FixPanel } from "@/components/fix-panel";
import { IngredientPills } from "@/components/ingredient-pills";
import { MealPlanner } from "@/components/meal-planner";
import { SkillSteps } from "@/components/skill-steps";
import { VideoSnippet } from "@/components/video-snippet";
import { RECIPES, getRecipe } from "@/lib/data/recipes";
import { forLevel, libraryRecipes } from "@/lib/library";
import { formatDuration, recipeHref, totalMinutes } from "@/lib/links";
import { findRecipe } from "@/lib/mealdb/client";
import { thumb } from "@/lib/mealdb/convert";
import { difficulty } from "@/lib/skill/difficulty";
import type { Recipe } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Plan a meal" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };

const planHref = (slugs: string[]) => `/plan?${slugs.map((s) => `dish=${encodeURIComponent(s)}`).join("&")}`;

/**
 * Plan a meal: pick a dish at your level from the database, then see its ingredients (with
 * pictures), the step-by-step method, a timeline with chimes for every dish you're cooking,
 * and Fix My Mistake.
 */
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ dish?: string | string[] }> }) {
  const viewer = await getViewer();
  const slugs = [...new Set([(await searchParams).dish ?? []].flat())].filter((s) => /^[a-z0-9-]{2,80}$/.test(s)).slice(0, 4);
  const dishes = (await Promise.all(slugs.map((s) => findRecipe(s, getRecipe)))).filter((r): r is Recipe => Boolean(r));
  const suggestions = forLevel([...RECIPES, ...libraryRecipes()], viewer.skill)
    .filter((r) => difficulty(r).level === viewer.skill && !slugs.includes(r.slug))
    .slice(0, dishes.length ? 8 : 24);

  if (!dishes.length) {
    return (
      <main className="mx-auto px-4 pb-10 pt-6">
        <h1 className="font-display text-[2.3rem]">Plan a meal</h1>
        <p className="mt-2 text-muted">
          Pick a dish made for your <strong className="text-ink">{LEVEL[viewer.skill]}</strong> level. You&apos;ll get the ingredients, the method step by step, timers that keep every dish on track, and help if anything goes wrong.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-4">
          {suggestions.map((r) => (
            <li key={r.slug}><PlanCard recipe={r} href={planHref([r.slug])} /></li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">Looking for something else? <Link href="/explore" className="underline">Explore every recipe</Link>, then tap &ldquo;Plan &amp; cook this&rdquo;.</p>
      </main>
    );
  }

  const main = dishes[0];
  const volume = main.ingredients.reduce((v, i) => v + (i.unit === "ml" || i.unit === "g" ? i.quantity : 0), 0);

  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <Link href="/plan" className="text-sm underline">← Choose a different meal</Link>
      <h1 className="mt-3 font-display text-[2.1rem]">{dishes.map((d) => d.title).join(" + ")}</h1>
      <p className="mt-1 text-muted">{difficulty(main).label} · about {formatDuration(dishes.reduce((m, d) => Math.max(m, totalMinutes(d)), 0))} · written for your {LEVEL[viewer.skill]} level</p>

      <div className="mt-5">
        {main.youtube ? (
          <VideoSnippet id={main.youtube} title={main.title} />
        ) : main.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- recipe photo
          <img src={main.image} alt="" className="aspect-video w-full rounded-3xl object-cover" />
        ) : null}
      </div>

      {dishes.map((d) => (
        <section key={d.slug} className="mt-8" aria-labelledby={`ing-${d.slug}`}>
          <h2 id={`ing-${d.slug}`} className="text-xl font-semibold">Ingredients{dishes.length > 1 ? `: ${d.title}` : ""}</h2>
          <p className="mt-1 text-sm text-muted">Anything in your pantry is marked, so you only buy what you need.</p>
          <div className="mt-3"><IngredientPills ingredients={d.ingredients} /></div>
        </section>
      ))}

      <section className="mt-10" aria-labelledby="timeline">
        <h2 id="timeline" className="text-xl font-semibold">Your cooking timeline</h2>
        <p className="mt-1 text-sm text-muted">
          {dishes.length > 1 ? "Every dish is staggered so they all finish hot together." : "Add a side below and we'll stagger both so they finish together."} Chimes and vibration tell you when to start each step.
        </p>
        <div className="mt-4"><MealPlanner recipes={dishes.map(({ slug, title, blocks }) => ({ slug, title, blocks }))} /></div>
      </section>

      {dishes.length < 4 && suggestions.length > 0 && (
        <section className="mt-8" aria-labelledby="add">
          <h2 id="add" className="text-lg font-semibold">Cooking more than one dish?</h2>
          <div className="rail -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
            {suggestions.map((r) => (
              <Link key={r.slug} href={planHref([...slugs, r.slug])} className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-line p-2 pr-3">
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- recipe photo
                  <img src={thumb(r.image)} alt="" className="h-14 w-14 rounded-xl object-cover" />
                )}
                <span className="min-w-0 text-sm"><span className="line-clamp-2 font-medium">{r.title}</span><span className="text-accent">+ Add to plan</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {dishes.map((d) => (
        <section key={d.slug} className="mt-10" aria-labelledby={`method-${d.slug}`}>
          <h2 id={`method-${d.slug}`} className="text-xl font-semibold">Method{dishes.length > 1 ? `: ${d.title}` : ""}, step by step</h2>
          <div className="mt-3"><SkillSteps recipe={d} initialSkill={viewer.skill} /></div>
          <Link href={`${recipeHref(d)}/cook`} className="mt-4 flex min-h-14 items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Start hands-free cook mode</Link>
        </section>
      ))}

      <div className="mt-10">
        <FixPanel dish={main.title} defaultVolumeMl={Math.max(250, Math.round(volume / 50) * 50)} aiReady={Boolean(process.env.GEMINI_API_KEY)} />
      </div>
    </main>
  );
}

function PlanCard({ recipe, href }: { recipe: Recipe; href: string }) {
  return (
    <Link href={href} className="group block">
      <span className="relative block overflow-hidden rounded-3xl bg-surface">
        {recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- recipe photo, 350 px
          <img src={thumb(recipe.image)} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="block aspect-square w-full bg-charcoal" />
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-button px-3 py-1 text-xs font-bold text-button-ink">Plan this</span>
      </span>
      <span className="mt-2 block leading-snug">{recipe.title}</span>
      <span className="text-sm text-muted">{formatDuration(totalMinutes(recipe))}</span>
    </Link>
  );
}

