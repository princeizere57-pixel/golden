"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CookView } from "@/components/cook-view";
import { RecipeDetail } from "@/components/recipe-detail";
import { activeMinutes } from "@/lib/skill/adapt";
import { difficulty } from "@/lib/skill/difficulty";
import { getImport } from "@/lib/import/store";
import type { Recipe, SkillLevel } from "@/lib/types";

function useImport(slug: string) {
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  useEffect(() => setRecipe(getImport(slug) ?? null), [slug]);
  return recipe;
}

function Missing() {
  return (
    <main className="mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Recipe not found on this device</h1>
      <p className="mt-2 text-muted">Imports are saved privately in this browser.</p>
      <Link href="/import" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-button px-6 font-semibold text-button-ink">Import a recipe</Link>
    </main>
  );
}

function Credit({ recipe }: { recipe: Recipe }) {
  // Imports always link to the original; anything without a source link has nothing to credit.
  if (!recipe.source?.url) return null;
  return (
    <p className="mt-3 text-sm">
      Original recipe{recipe.chef !== recipe.source.name && <> by <strong>{recipe.chef}</strong></>} on{" "}
      <a href={recipe.source.url} target="_blank" rel="noopener noreferrer" className="underline">{recipe.source.name} ↗</a>
    </p>
  );
}

export function MyRecipe({ slug, skill, canCook }: { slug: string; skill: SkillLevel; canCook: boolean }) {
  const recipe = useImport(slug);
  if (recipe === undefined) return <main className="mx-auto px-4 py-10 text-muted">Loading…</main>;
  if (!recipe) return <Missing />;
  // Private to this device: no "Plan it" or pairings (Plan a meal can't read on-device imports).
  return (
    <RecipeDetail
      recipe={{ ...recipe, category: "My imports · private" }}
      skill={skill}
      level={difficulty(recipe).label}
      activeMinutes={activeMinutes(recipe)}
      cookHref={`/my/${recipe.slug}/cook`}
      access={canCook ? "open" : "locked-cook"}
      credit={<Credit recipe={recipe} />}
      methodNote="Steps, timers and cues were generated from the original method. Check the original if anything looks off."
    />
  );
}

export function MyRecipeCook({ slug, skill, canFix }: { slug: string; skill: SkillLevel; canFix: boolean }) {
  const recipe = useImport(slug);
  if (recipe === undefined) return <main className="cook-mode min-h-screen" />;
  if (!recipe) return <Missing />;
  return <CookView recipe={recipe} initialSkill={skill} canFix={canFix} exitHref={`/my/${recipe.slug}`} />;
}
