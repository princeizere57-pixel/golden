import type { Metadata } from "next";
import Link from "next/link";
import { mealCategories, mealsByCategory, searchMeals } from "@/lib/mealdb/client";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Explore recipes" };

const DEFAULT_CATEGORY = "Pasta";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const { q, c } = await searchParams;
  const query = q?.trim().slice(0, 60);
  const category = query ? undefined : (c ?? DEFAULT_CATEGORY);
  const [categories, meals] = await Promise.all([mealCategories(), query ? searchMeals(query) : mealsByCategory(category!)]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Explore recipes</h1>
      <p className="mt-2 text-muted">Hundreds of dishes from around the world, each rewritten for your skill level with cook mode and timers.</p>

      <form action="/explore" className="mt-6 flex gap-3" role="search">
        <label htmlFor="q" className="sr-only">Search recipes</label>
        <input id="q" name="q" defaultValue={query} placeholder="Search: curry, lasagne, pancakes…" className="min-h-12 flex-1 rounded-2xl border border-line bg-surface px-4" />
        <button className="min-h-12 rounded-2xl bg-accent px-5 font-semibold text-accent-ink">Search</button>
      </form>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="rail -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {categories.map((name) => (
            <Link
              key={name}
              href={`/explore?c=${encodeURIComponent(name)}`}
              aria-current={category === name ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${category === name ? "border-ink bg-ink text-bg" : "border-line bg-surface"}`}
            >
              {name}
            </Link>
          ))}
        </nav>
      )}

      <h2 className="mt-8 text-xl font-bold">{query ? `Results for “${query}”` : category}</h2>
      {meals.length === 0 ? (
        <p className="mt-3 text-muted">{categories.length ? "No recipes found. Try another search." : "Couldn't reach the recipe library. Check your connection and try again."}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {meals.map((m) => (
            <li key={m.idMeal}>
              <Link href={`/meals/${m.idMeal}`} className="group block">
                {m.strMealThumb && (
                  // eslint-disable-next-line @next/next/no-img-element -- served by TheMealDB's CDN
                  <img src={thumb(m.strMealThumb)} alt="" loading="lazy" className="aspect-square w-full rounded-3xl object-cover transition-transform group-hover:scale-[1.02]" />
                )}
                <span className="mt-2 block font-semibold leading-snug">{m.strMeal}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-12 text-xs text-muted">
        Recipes and photos from <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer" className="underline">TheMealDB</a>.
      </p>
    </main>
  );
}
