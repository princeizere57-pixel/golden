import type { Metadata } from "next";
import { PantryMatcher } from "@/components/pantry-matcher";
import { LockedPage } from "@/components/plan-lock";
import { can } from "@/lib/billing/entitlements";
import { getViewer } from "@/lib/viewer";
import { RECIPES } from "@/lib/data/recipes";
import { libraryRecipes } from "@/lib/library";
import { recipeHref } from "@/lib/links";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Pantry-to-Plate" };

/** Pantry-to-Plate Matcher: leftovers in, a matching meal out. */
export default async function PantryPage() {
  if (!can((await getViewer()).tier, "pantry")) return <LockedPage feature="pantry" heading="Pantry-to-Plate" back={{ href: "/", label: "Back to Discover" }} />;
  const recipes = [...RECIPES, ...libraryRecipes()].map((r) => ({
    slug: r.slug,
    href: recipeHref(r),
    title: r.title,
    image: r.image ? thumb(r.image) : undefined,
    ingredients: r.ingredients.map((i) => i.name),
  }));
  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <h1 className="font-display text-[2.3rem]">Pantry-to-<span className="text-accent">Plate</span></h1>
      <p className="mt-2 text-muted">Clear out the fridge, waste nothing and skip the shop. Golden cross-references {recipes.length} recipes with what you already have.</p>
      <PantryMatcher recipes={recipes} />
    </main>
  );
}
