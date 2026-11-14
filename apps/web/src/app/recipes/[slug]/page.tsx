import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetail, type CookAccess } from "@/components/recipe-detail";
import { can } from "@/lib/billing/entitlements";
import { catalogue, catalogueRecipe } from "@/lib/catalogue";
import { planHref } from "@/lib/links";
import { pairingsFor } from "@/lib/pairings";
import { activeMinutes } from "@/lib/skill/adapt";
import { difficulty } from "@/lib/skill/difficulty";
import { getViewer } from "@/lib/viewer";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await catalogue()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await catalogueRecipe((await params).slug);
  return recipe ? { title: recipe.title, description: recipe.summary } : {};
}

export default async function RecipePage({ params }: Props) {
  const recipe = await catalogueRecipe((await params).slug);
  if (!recipe) notFound();
  const viewer = await getViewer();
  const access: CookAccess = recipe.premium && !can(viewer.tier, "premiumRecipes") ? "locked-recipe" : can(viewer.tier, "cookMode") ? "open" : "locked-cook";

  return (
    <RecipeDetail
      recipe={recipe}
      skill={viewer.skill}
      level={difficulty(recipe).label}
      activeMinutes={activeMinutes(recipe)}
      cookHref={`/recipes/${recipe.slug}/cook`}
      planHref={planHref([recipe.slug])}
      access={access}
      pairings={pairingsFor(recipe, await catalogue())}
    />
  );
}
