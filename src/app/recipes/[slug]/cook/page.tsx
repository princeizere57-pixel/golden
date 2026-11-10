import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookView } from "@/components/cook-view";
import { LockedPage } from "@/components/plan-lock";
import { can } from "@/lib/billing/entitlements";

import { RECIPES, getRecipe } from "@/lib/data/recipes";
import { safePlanBack } from "@/lib/links";
import { getViewer } from "@/lib/viewer";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ back?: string }> };

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = getRecipe((await params).slug);
  return recipe ? { title: `Cooking ${recipe.title}` } : {};
}

export default async function CookPage({ params, searchParams }: Props) {
  const recipe = getRecipe((await params).slug);
  if (!recipe) notFound();
  const viewer = await getViewer();
  const back = safePlanBack((await searchParams).back);
  const exit = { href: back ?? `/recipes/${recipe.slug}`, label: "Back to the recipe" };
  if (recipe.premium && !can(viewer.tier, "premiumRecipes")) return <LockedPage feature="premiumRecipes" heading={recipe.title} back={exit} />;
  if (!can(viewer.tier, "cookMode")) return <LockedPage feature="cookMode" heading={recipe.title} back={exit} />;
  return <CookView recipe={recipe} initialSkill={viewer.skill} canFix={can(viewer.tier, "fixMyMistake")} {...(back ? { exitHref: back } : {})} />;
}
