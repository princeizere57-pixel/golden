import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CookView } from "@/components/cook-view";
import { RECIPES, getRecipe } from "@/lib/data/recipes";
import { getViewer } from "@/lib/viewer";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = getRecipe((await params).slug);
  return recipe ? { title: `Cooking ${recipe.title}` } : {};
}

export default async function CookPage({ params }: Props) {
  const recipe = getRecipe((await params).slug);
  if (!recipe) notFound();
  const viewer = await getViewer();
  if (recipe.premium && viewer.plan === "free") redirect("/premium");
  return <CookView recipe={recipe} initialSkill={viewer.skill} />;
}
