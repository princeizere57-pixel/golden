"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CookView } from "@/components/cook-view";
import { UnlockButton } from "@/components/plan-lock";
import { SkillSteps } from "@/components/skill-steps";
import { SourcePhoto } from "@/components/source-photo";
import { getImport } from "@/lib/import/store";
import type { Recipe, SkillLevel } from "@/lib/types";
import { ClawLoader } from "@/components/claw-loader";

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
  if (recipe === undefined) return <ClawLoader />;
  if (!recipe) return <Missing />;
  return (
    <main className="mx-auto grid gap-10 px-4 py-10 pb-24">
      <aside>
        <SourcePhoto recipe={recipe} className="mb-6 aspect-[4/3]" />
        <p className="text-sm text-muted">My imports · private</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{recipe.title}</h1>
        <Credit recipe={recipe} />
        {recipe.summary && <p className="mt-3 text-muted">{recipe.summary}</p>}
        <h2 className="mt-8 font-bold">Ingredients · serves {recipe.serves}</h2>
        <ul className="mt-2 divide-y divide-line">
          {recipe.ingredients.map((i) => <li key={i.id} className="py-2 text-sm">{i.raw ?? i.name}</li>)}
        </ul>
        {canCook ? (
          <Link href={`/my/${recipe.slug}/cook`} className="mt-6 flex min-h-14 items-center justify-center rounded-full bg-button font-semibold text-button-ink">Start cook mode</Link>
        ) : (
          <UnlockButton feature="cookMode" label="Unlock cook mode" />
        )}
      </aside>
      <section aria-label="Method">
        <SkillSteps recipe={recipe} initialSkill={skill} />
        <p className="mt-6 text-xs text-muted">Steps, timers and cues were generated from the original method. Check the original if anything looks off.</p>
      </section>
    </main>
  );
}

export function MyRecipeCook({ slug, skill, canFix }: { slug: string; skill: SkillLevel; canFix: boolean }) {
  const recipe = useImport(slug);
  if (recipe === undefined) return <main className="cook-mode min-h-screen" />;
  if (!recipe) return <Missing />;
  return <CookView recipe={recipe} initialSkill={skill} canFix={canFix} exitHref={`/my/${recipe.slug}`} />;
}
