import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookView } from "@/components/cook-view";
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
  return <CookView recipe={recipe} initialSkill={viewer.skill} exitHref={safePlanBack((await searchParams).back) ?? `/meals/${id}`} />;
}
