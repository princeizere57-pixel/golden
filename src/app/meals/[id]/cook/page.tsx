import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookView } from "@/components/cook-view";
import { LockedPage } from "@/components/plan-lock";
import { can } from "@/lib/billing/entitlements";

import { mealRecipe } from "@/lib/mealdb/client";
import { safePlanBack } from "@/lib/links";
import { getViewer } from "@/lib/viewer";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ back?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = await mealRecipe((await params).id);
  return recipe ? { title: `Cooking ${recipe.title}` } : {};
}

export default async function MealCookPage({ params, searchParams }: Props) {
  const { id } = await params;
  const [recipe, viewer] = await Promise.all([mealRecipe(id), getViewer()]);
  if (!recipe) notFound();
  const exitHref = safePlanBack((await searchParams).back) ?? `/meals/${id}`;
  if (!can(viewer.tier, "cookMode")) return <LockedPage feature="cookMode" heading={recipe.title} back={{ href: exitHref, label: "Back to the recipe" }} />;
  return <CookView recipe={recipe} initialSkill={viewer.skill} canFix={can(viewer.tier, "fixMyMistake")} exitHref={exitHref} />;
}
