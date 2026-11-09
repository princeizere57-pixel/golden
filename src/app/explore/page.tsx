import type { Metadata } from "next";
import Link from "next/link";
import { chooseSkill } from "@/app/actions/viewer";
import { categoryRecipes, mealCategories, searchRecipes } from "@/lib/mealdb/client";
import { MEALDB_PREFIX, thumb } from "@/lib/mealdb/convert";
import { difficulty, rankForSkill } from "@/lib/skill/difficulty";
import { SKILL_LEVELS, type Recipe, type SkillLevel } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Explore recipes" };

const DEFAULT_CATEGORY = "Pasta";
const SKILL_LABEL: Record<SkillLevel, string> = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
const BADGE = { Easy: "bg-basil", Medium: "bg-saffron", Advanced: "bg-aubergine" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const { q, c } = await searchParams;
  const query = q?.trim().slice(0, 60);
  const category = query ? undefined : (c ?? DEFAULT_CATEGORY);
  const [viewer, categories, recipes] = await Promise.all([getViewer(), mealCategories(), query ? searchRecipes(query) : categoryRecipes(category!)]);

  const rated = recipes.map((recipe) => ({ recipe, difficulty: difficulty(recipe) }));
  const ranked = rankForSkill(rated, viewer.skill, (r) => r.difficulty.level);
  const forYou = ranked.filter((r) => r.difficulty.level === viewer.skill);
  const others = ranked.filter((r) => r.difficulty.level !== viewer.skill);
  const harder = (level: SkillLevel) => SKILL_LEVELS.indexOf(level) > SKILL_LEVELS.indexOf(viewer.skill);
  const othersHeading = others.every((r) => harder(r.difficulty.level))
    ? "Ready for a challenge"
    : others.every((r) => !harder(r.difficulty.level))
      ? "Quick and easy wins"
      : "More to try";

  return (
    <main className="mx-auto px-4 py-10 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Explore recipes</h1>
      <p className="mt-2 text-muted">Dishes from around the world, ranked for your skill level and rewritten for it in cook mode.</p>

      <form action={chooseSkill} className="mt-5 flex flex-wrap items-center gap-2" aria-label="Your cooking level">
        <span className="mr-1 text-sm font-semibold">Your level:</span>
        {SKILL_LEVELS.map((s) => (
          <button
            key={s}
            name="skill"
            value={s}
            aria-pressed={viewer.skill === s}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${viewer.skill === s ? "border-accent bg-button text-button-ink" : "border-line bg-surface"}`}
          >
            {SKILL_LABEL[s]}
          </button>
        ))}
      </form>

      <form action="/explore" className="mt-5 flex gap-3" role="search">
        <label htmlFor="q" className="sr-only">Search recipes</label>
        <input id="q" name="q" defaultValue={query} placeholder="Search: curry, lasagne, pancakes…" className="min-h-12 flex-1 rounded-2xl border border-line bg-surface px-4" />
        <button className="min-h-12 rounded-2xl bg-button px-5 font-semibold text-button-ink">Search</button>
      </form>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="rail -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {categories.map((name) => (
            <Link
              key={name}
              href={`/explore?c=${encodeURIComponent(name)}`}
              aria-current={category === name ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${category === name ? "border-button bg-button text-button-ink" : "border-line bg-surface"}`}
            >
              {name}
            </Link>
          ))}
        </nav>
      )}

      {recipes.length === 0 ? (
        <p className="mt-8 text-muted">{categories.length ? "No recipes found. Try another search." : "Couldn't reach the recipe library. Check your connection and try again."}</p>
      ) : (
        <>
          <Grid
            heading={`${query ? `“${query}”` : category}: best for ${SKILL_LABEL[viewer.skill]} cooks`}
            empty={`Nothing here is rated for ${SKILL_LABEL[viewer.skill]} level yet. The closest matches are below.`}
            items={forYou}
          />
          {others.length > 0 && <Grid heading={othersHeading} items={others} />}
        </>
      )}
      <p className="mt-12 text-xs text-muted">
        Recipes and photos from <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer" className="underline">TheMealDB</a>. Difficulty is estimated from ingredients, steps, time and techniques.
      </p>
    </main>
  );
}

function Grid({ heading, items, empty }: { heading: string; items: Array<{ recipe: Recipe; difficulty: ReturnType<typeof difficulty> }>; empty?: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold">{heading}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map(({ recipe, difficulty: d }) => (
            <li key={recipe.slug}>
              <Link href={`/meals/${recipe.slug.slice(MEALDB_PREFIX.length)}`} className="group block">
                <span className="relative block">
                  {recipe.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- served by TheMealDB's CDN
                    <img src={thumb(recipe.image)} alt="" width={350} height={350} loading="lazy" className="aspect-square w-full rounded-3xl object-cover transition-transform group-hover:scale-[1.02]" />
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${BADGE[d.label]}`}>{d.label}</span>
                </span>
                <span className="mt-2 block font-semibold leading-snug">{recipe.title}</span>
                <span className="text-xs text-muted">{recipe.ingredients.length} ingredients · {recipe.blocks.length} {recipe.blocks.length === 1 ? "step" : "steps"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
