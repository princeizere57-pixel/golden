import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToListButton, SaveButton } from "@/components/recipe-actions";
import { SkillSteps } from "@/components/skill-steps";
import { SourcePhoto } from "@/components/source-photo";
import { mealRecipe } from "@/lib/mealdb/client";
import { activeMinutes } from "@/lib/skill/adapt";
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
  const total = recipe.blocks.reduce((s, b) => s + b.minutes, 0);

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 pb-24 lg:grid-cols-[1fr_2fr]">
      <aside>
        <SourcePhoto recipe={recipe} className="mb-6 aspect-square" />
        <p className="text-sm text-muted">{recipe.summary}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{recipe.title}</h1>
        <p className="mt-3 text-sm">
          Recipe from{" "}
          <a href={recipe.source!.url} target="_blank" rel="noopener noreferrer" className="underline">TheMealDB ↗</a>
        </p>
        <dl className="mt-4 flex gap-6 text-sm">
          <div><dt className="text-muted">Hands-on</dt><dd className="font-semibold">~{Math.round(activeMinutes(recipe))} min</dd></div>
          <div><dt className="text-muted">Total</dt><dd className="font-semibold">~{Math.round(total)} min</dd></div>
        </dl>
        <h2 className="mt-8 font-bold">Ingredients</h2>
        <ul className="mt-2 divide-y divide-line">
          {recipe.ingredients.map((i) => <li key={i.id} className="py-2 text-sm">{i.raw ?? i.name}</li>)}
        </ul>
        <div className="mt-6 flex gap-3">
          <SaveButton recipe={recipe} />
          <AddToListButton recipe={recipe} />
        </div>
        <Link href={`/meals/${id}/cook`} className="mt-4 flex min-h-14 items-center justify-center rounded-full bg-button font-semibold text-button-ink">Start cook mode</Link>
      </aside>
      <section aria-label="Method">
        <SkillSteps recipe={recipe} initialSkill={viewer.skill} />
        <p className="mt-6 text-xs text-muted">Timers and cues are worked out from the original method; times are estimates where the recipe doesn&apos;t give one.</p>
      </section>
    </main>
  );
}
