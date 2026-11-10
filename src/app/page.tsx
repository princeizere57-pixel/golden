import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionCard, DishOfTheDay, PhotoCard, QuickTile, Rail, SearchBar } from "@/components/discover";
import { FridgeIcon } from "@/components/icons-3d";
import { MiniYou } from "@/components/mini-you";
import { PantryRail } from "@/components/pantry";
import { recipeHref } from "@/lib/links";
import { FeedbackPrompt } from "@/components/feedback-prompt";
import { TodayCard } from "@/components/today-card";
import { TRIAL_HEADLINE_DAYS, offerById } from "@/lib/billing/offers";
import { RECIPES } from "@/lib/data/recipes";
import { byCategory, dishOfTheDay, forLevel, libraryRecipes } from "@/lib/library";
import { formatDuration, planHref, totalMinutes } from "@/lib/links";
import { thumb } from "@/lib/mealdb/convert";
import { difficulty } from "@/lib/skill/difficulty";
import type { Recipe } from "@/lib/types";
import { getUser } from "@/lib/auth";
import { getViewer } from "@/lib/viewer";

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };

/** Collections pitched per level: same categories, different promise. */
const COLLECTIONS = {
  beginner: [
    { category: "Pasta", title: "First-win pasta", line: "Short methods, big flavour, nothing to fear." },
    { category: "Chicken", title: "Chicken, cooked right", line: "Learn when it's done without cutting it open." },
    { category: "Vegetarian", title: "Easy veggie dinners", line: "One pan, few steps, lots of colour." },
  ],
  intermediate: [
    { category: "Chicken", title: "Weeknight chicken upgrades", line: "Pan sauces, proper sears, better timing." },
    { category: "Seafood", title: "Cook fish with confidence", line: "Crisp skin and juicy flakes, every time." },
    { category: "Pasta", title: "Pasta beyond the jar", line: "Emulsified sauces and al dente by feel." },
  ],
  chef: [
    { category: "Beef", title: "Braises and big projects", line: "Low and slow, with the science behind it." },
    { category: "Dessert", title: "Pastry and precision", line: "Where grams and degrees really matter." },
    { category: "Seafood", title: "Seafood, restaurant-style", line: "Timing to the second, sauces to the gram." },
  ],
};

const TILES = [
  { label: "Easy wins", category: "Pasta" },
  { label: "Chicken dinners", category: "Chicken" },
  { label: "Veggie nights", category: "Vegetarian" },
  { label: "Seafood", category: "Seafood" },
  { label: "Something sweet", category: "Dessert" },
  { label: "Breakfast & brunch", category: "Breakfast" },
];

export default async function Discover({ searchParams }: { searchParams: Promise<{ trial?: string }> }) {
  const [viewer, user] = await Promise.all([getViewer(), getUser()]);
  if (!user) redirect("/welcome");
  if (!viewer.onboarded) redirect("/onboarding");
  const { trial } = await searchParams;

  const library = libraryRecipes();
  const quick = forLevel(library.filter((r) => totalMinutes(r) <= viewer.prefs.weeknightMinutes), viewer.skill).slice(0, 10);
  const picks = forLevel(library, viewer.skill).filter((r) => difficulty(r).level === viewer.skill).slice(0, 10);
  const stretch = library.filter((r) => difficulty(r).level === (viewer.skill === "beginner" ? "intermediate" : "chef")).slice(0, 10);
  const today = dishOfTheDay(viewer.skill);
  // Tonight's pick for the Today card: a real-time recipe, a different one each day.
  const realTime = RECIPES.filter((r) => r.realTime);
  const pickRecipe = realTime[Math.floor(Date.now() / 86_400_000) % Math.max(1, realTime.length)];
  const pick = pickRecipe && {
    title: pickRecipe.title,
    minutes: formatDuration(totalMinutes(pickRecipe)),
    cookHref: `${recipeHref(pickRecipe)}/cook`,
    planHref: planHref([pickRecipe.slug], pickRecipe.slug),
    image: pickRecipe.image ? thumb(pickRecipe.image) : undefined,
  };
  const firstImage = (category: string) => {
    const r = byCategory(category).find((x) => x.image);
    return r?.image ? thumb(r.image) : undefined;
  };

  return (
    <main className="mx-auto pb-10">
      <div className="flex items-center justify-between px-4 pt-6">
        <h1 className="font-display text-[2.3rem]">Discover</h1>
        <div className="flex gap-2">
          <Link href="/you" aria-label="Mini You and your progress" className="h-12 w-12 overflow-hidden rounded-full bg-button">
            <MiniYou headOnly size={48} />
          </Link>
          <Link href="/account" aria-label="Account and settings" className="flex h-12 w-12 items-center justify-center rounded-full bg-button text-button-ink">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
          </Link>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-bg/95 px-4 py-3 backdrop-blur">
        <SearchBar />
      </div>

      {trial === "started" && <p role="status" className="mx-4 mt-2 rounded-2xl bg-basil p-4 text-white">Your free trial has started. Happy cooking!</p>}

      <TodayCard name={user.name.split(" ")[0] || "chef"} pick={pick} />

      <p className="mt-3 px-4 text-sm text-muted">
        Cooking at <strong className="text-ink">{LEVEL[viewer.skill]}</strong> level. Every recipe is rewritten for you.
      </p>

      <Link href="/pantry" className="mx-4 mt-4 flex items-center gap-3 rounded-3xl bg-accent-soft p-4">
        <FridgeIcon size={44} className="shrink-0" />
        <span className="flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Pantry-to-Plate</span>
          <span className="mt-0.5 block font-semibold leading-snug">Use it before you lose it: turn what&apos;s in your fridge into dinner.</span>
        </span>
        <span aria-hidden className="text-2xl text-accent">›</span>
      </Link>

      <nav aria-label="Quick links" className="mt-4 grid grid-cols-2 gap-2.5 px-4">
        {TILES.map((t) => <QuickTile key={t.label} href={`/explore?c=${t.category}`} label={t.label} image={firstImage(t.category)} />)}
      </nav>

      <Rail heading={`Personalised picks for ${LEVEL[viewer.skill]} cooks`}>
        {COLLECTIONS[viewer.skill].map((c) => (
          <CollectionCard key={c.title} title={c.title} line={c.line} href={`/explore?c=${c.category}`} recipes={forLevel(byCategory(c.category), viewer.skill).slice(0, 4)} />
        ))}
      </Rail>

      <Rail heading="New recipes">
        {RECIPES.map((r) => <PhotoCard key={r.slug} recipe={r} badge="NEW" />)}
      </Rail>

      <Rail heading="Real-time cooking: prep while it cooks">
        {RECIPES.filter((r) => r.realTime).map((r) => <PhotoCard key={r.slug} recipe={r} />)}
      </Rail>

      <PantryRail recipes={library.slice(0, 200).map((r) => ({ slug: r.slug, href: recipeHref(r), title: r.title, image: r.image ? thumb(r.image) : undefined, ingredients: r.ingredients.map((i) => i.name) }))} />

      {picks.length > 0 && <Rail heading="Right at your level" href="/for-you">{picks.map((r) => <PhotoCard key={r.slug} recipe={r} />)}</Rail>}

      {today && <DishOfTheDay recipe={today} />}

      {quick.length > 0 && (
        <Rail heading={`Done in ${viewer.prefs.weeknightMinutes} minutes or less`}>
          {quick.map((r) => <PhotoCard key={r.slug} recipe={r} />)}
        </Rail>
      )}

      {viewer.skill !== "chef" && stretch.length > 0 && (
        <Rail heading="Ready to stretch yourself">{stretch.map((r: Recipe) => <PhotoCard key={r.slug} recipe={r} />)}</Rail>
      )}

      {library.length === 0 && (
        <p className="mt-10 px-4 text-sm text-muted">Run <code>npm run data:mealdb</code> to fill Discover with hundreds of recipes.</p>
      )}

      {viewer.plan === "free" && (
        <section className="mx-4 mt-12 rounded-3xl bg-accent-soft p-7">
          <h2 className="font-display text-2xl">Cook anything, at your level</h2>
          <p className="mt-2 max-w-xl text-muted">Every recipe rewritten for you, hands-free cook mode and Fix My Mistake. {TRIAL_HEADLINE_DAYS}-day Zero-Waste Challenge free, then the Executive Chef System at a ${offerById("executive")!.price} a year founding price (80% off).</p>
          <Link href="/checkout" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-button px-6 font-semibold text-button-ink">Start free trial</Link>
        </section>
      )}

      <p className="mt-10 px-4 text-xs text-muted">Recipe photos from TheMealDB.</p>
      <FeedbackPrompt />
    </main>
  );
}
