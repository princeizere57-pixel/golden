import type { Metadata } from "next";
import Link from "next/link";
import { FixPanel } from "@/components/fix-panel";
import { IngredientPills } from "@/components/ingredient-pills";
import { MealPlanner } from "@/components/meal-planner";
import { LockedPage, PlanLock } from "@/components/plan-lock";
import { DishCards, DishPicker, FinishDish, type DishOption } from "@/components/plan-dishes";
import { SkillSteps } from "@/components/skill-steps";
import { VideoSnippet } from "@/components/video-snippet";
import { catalogue, catalogueRecipe } from "@/lib/catalogue";
import { forLevel, libraryRecipes } from "@/lib/library";
import { MAX_DISHES, formatDuration, planHref, recipeHref, totalMinutes } from "@/lib/links";
import { findRecipe } from "@/lib/mealdb/client";
import { thumb } from "@/lib/mealdb/convert";
import { can } from "@/lib/billing/entitlements";
import { difficulty } from "@/lib/skill/difficulty";
import type { Recipe } from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import { MealDbCredit } from "@/components/mealdb-credit";

export const metadata: Metadata = { title: "Plan a meal" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };

const option = (r: Recipe): DishOption => ({ slug: r.slug, title: r.title, image: r.image ? thumb(r.image) : undefined, minutes: formatDuration(totalMinutes(r)) });

/**
 * Plan a meal: pick 1–4 dishes at your level. Each becomes a rounded card; open one to see its
 * video, ingredients, method, cook mode and Fix My Mistake, then move on until all are finished.
 * With several dishes, one timeline staggers them so they finish hot together.
 */
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ dish?: string | string[]; active?: string }> }) {
  const viewer = await getViewer();
  if (!can(viewer.tier, "singleDishPlan")) return <LockedPage feature="singleDishPlan" heading="Plan a meal" back={{ href: "/explore", label: "Browse recipes instead" }} />;
  // Executive times 2–4 dishes together; The Golden Experience plans one dish at a time.
  const multi = can(viewer.tier, "multiDish");
  const max = multi ? MAX_DISHES : 1;
  const canFix = can(viewer.tier, "fixMyMistake");
  const params = await searchParams;
  const asked = [...new Set([params.dish ?? []].flat())].filter((s) => /^[a-z0-9-]{2,80}$/.test(s));
  const slugs = asked.slice(0, max);
  const dishes = (await Promise.all(slugs.map((s) => findRecipe(s, catalogueRecipe)))).filter((r): r is Recipe => Boolean(r));

  if (!dishes.length) {
    const choices = forLevel([...(await catalogue()), ...libraryRecipes()], viewer.skill)
      .filter((r) => difficulty(r).level === viewer.skill)
      .slice(0, 30);
    return (
      <main className="mx-auto px-4 pb-10 pt-6">
        <h1 className="font-display text-[2.3rem]">Plan a meal</h1>
        <p className="mt-2 text-muted">
          {multi ? (
            <>Pick one dish, or up to {MAX_DISHES} to cook together, made for your <strong className="text-ink">{LEVEL[viewer.skill]}</strong> level. We&apos;ll time them so everything finishes hot at once.</>
          ) : (
            <>Pick a dish made for your <strong className="text-ink">{LEVEL[viewer.skill]}</strong> level. We&apos;ll time every step for you.</>
          )}
        </p>
        {!multi && <div className="mt-4"><PlanLock feature="multiDish" compact /></div>}
        <DishPicker options={choices.map(option)} max={max} />
        <p className="mt-8 text-sm text-muted">Looking for something else? <Link href="/explore" className="underline">Explore every recipe</Link>, then tap &ldquo;Plan &amp; cook this&rdquo;.</p>
        <MealDbCredit flush />
      </main>
    );
  }

  const ids = dishes.map((d) => d.slug);
  const current = dishes.find((d) => d.slug === params.active) ?? dishes[0];
  const index = dishes.indexOf(current);
  const next = dishes[index + 1];
  const here = planHref(ids, current.slug);
  const volume = current.ingredients.reduce((v, i) => v + (i.unit === "ml" || i.unit === "g" ? i.quantity : 0), 0);

  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <Link href="/plan" className="text-sm underline">← Choose different meals</Link>
      <h1 className="mt-3 font-display text-[2rem]">{dishes.length === 1 ? current.title : `Your ${dishes.length}-dish meal`}</h1>
      {!multi && asked.length > 1 && <div className="mt-4"><PlanLock feature="multiDish" compact /></div>}

      {dishes.length > 1 && (
        <>
          <div className="mt-4"><DishCards dishes={dishes.map(option)} active={current.slug} /></div>
          <section className="mt-8" aria-labelledby="timeline">
            <h2 id="timeline" className="text-xl font-semibold">Timeline for all {dishes.length} dishes</h2>
            <p className="mt-1 text-sm text-muted">Every start is staggered so they all finish hot together. Chimes and vibration tell you when to switch.</p>
            <div className="mt-4"><MealPlanner recipes={dishes.map(({ slug, title, blocks }) => ({ slug, title, blocks }))} /></div>
          </section>
        </>
      )}

      <section className="mt-10" aria-labelledby="current">
        {dishes.length > 1 && <p className="text-sm font-semibold uppercase tracking-wide text-accent">Dish {index + 1} of {dishes.length}</p>}
        <h2 id="current" className="font-display text-[1.7rem]">{current.title}</h2>
        <p className="mt-1 text-muted">{difficulty(current).label} · about {formatDuration(totalMinutes(current))} · written for your {LEVEL[viewer.skill]} level</p>

        <div className="mt-4">
          {current.youtube ? (
            <VideoSnippet id={current.youtube} title={current.title} />
          ) : current.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- recipe photo
            <img src={current.image} alt="" className="aspect-video w-full rounded-3xl object-cover" />
          ) : null}
        </div>

        <h3 className="mt-8 text-xl font-semibold">Ingredients</h3>
        <p className="mt-1 text-sm text-muted">Anything in your pantry is marked, so you only buy what you need.</p>
        <div className="mt-3"><IngredientPills ingredients={current.ingredients} /></div>

        {dishes.length === 1 && (
          <div className="mt-10">
            <h3 className="text-xl font-semibold">Your cooking timeline</h3>
            <p className="mt-1 text-sm text-muted">Chimes and vibration tell you when to start each step.</p>
            <div className="mt-4"><MealPlanner recipes={[current].map(({ slug, title, blocks }) => ({ slug, title, blocks }))} /></div>
          </div>
        )}

        <h3 className="mt-10 text-xl font-semibold">Method, step by step</h3>
        <div className="mt-3"><SkillSteps recipe={current} initialSkill={viewer.skill} /></div>
        <Link href={`${recipeHref(current)}/cook?back=${encodeURIComponent(here)}`} className="mt-4 flex min-h-14 items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">
          Start hands-free cook mode
        </Link>
        <div className="mt-3"><FinishDish slug={current.slug} next={next ? planHref(ids, next.slug) : undefined} /></div>
      </section>

      <div className="mt-10">
        {canFix ? (
          <FixPanel dish={current.title} defaultVolumeMl={Math.max(250, Math.round(volume / 50) * 50)} aiReady={Boolean(process.env.GEMINI_API_KEY)} />
        ) : (
          <PlanLock feature="fixMyMistake" compact />
        )}
      </div>
      <MealDbCredit flush />
    </main>
  );
}
