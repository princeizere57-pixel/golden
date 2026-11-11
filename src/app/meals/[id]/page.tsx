import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipe-detail";
import { can } from "@/lib/billing/entitlements";
import { RECIPES } from "@/lib/data/recipes";
import { planHref } from "@/lib/links";
import { mealRecipe } from "@/lib/mealdb/client";
import { pairingsFor } from "@/lib/pairings";
import { activeMinutes } from "@/lib/skill/adapt";
import { difficulty } from "@/lib/skill/difficulty";
import { getViewer } from "@/lib/viewer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await mealRecipe((await params).id);
  return recipe ? { title: recipe.title, description: recipe.summary } : {};
}

export default async function MealPage({ params }: Props) {
  const { id } = await params;
  const [recipe, viewer] = await Promise.all([mealRecipe(id), getViewer()]);
  if (!recipe) notFound();

  return (
    <RecipeDetail
      recipe={recipe}
      skill={viewer.skill}
      level={difficulty(recipe).label}
      activeMinutes={activeMinutes(recipe)}
      cookHref={`/meals/${id}/cook`}
      planHref={planHref([recipe.slug])}
      access={can(viewer.tier, "cookMode") ? "open" : "locked-cook"}
      pairings={pairingsFor(recipe, RECIPES)}
      credit={
        <p className="mt-3 text-sm">
          Recipe from <a href={recipe.source!.url} target="_blank" rel="noopener noreferrer" className="underline">TheMealDB ↗</a>
        </p>
      }
      methodNote="Timers and cues are worked out from the original method; times are estimates where the recipe doesn't give one."
    />
  );
}
