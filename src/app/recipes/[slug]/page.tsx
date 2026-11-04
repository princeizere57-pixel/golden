import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToListButton, SaveButton } from "@/components/recipe-actions";
import { SkillSteps } from "@/components/skill-steps";
import { SourcePhoto } from "@/components/source-photo";
import { RECIPES, getRecipe } from "@/lib/data/recipes";
import { activeMinutes } from "@/lib/skill/adapt";
import { getViewer } from "@/lib/viewer";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = getRecipe((await params).slug);
  return recipe ? { title: recipe.title, description: recipe.summary } : {};
}

export default async function RecipePage({ params }: Props) {
  const recipe = getRecipe((await params).slug);
  if (!recipe) notFound();
  const viewer = await getViewer();
  const locked = recipe.premium && viewer.plan === "free";
  const total = recipe.blocks.reduce((s, b) => s + b.minutes, 0);

  return (
    <main className="mx-auto grid gap-10 px-4 py-10 pb-24">
      <aside>
        <SourcePhoto recipe={recipe} className="mb-6 aspect-square" />
        <p className="text-sm text-muted">{recipe.category} · {recipe.chef}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{recipe.title}</h1>
        <p className="mt-3 text-muted">{recipe.summary}</p>
        <dl className="mt-4 flex gap-6 text-sm">
          <div><dt className="text-muted">Serves</dt><dd className="font-semibold">{recipe.serves}</dd></div>
          <div><dt className="text-muted">Hands-on</dt><dd className="font-semibold">{activeMinutes(recipe)} min</dd></div>
          <div><dt className="text-muted">Total</dt><dd className="font-semibold">{Math.round(total)} min</dd></div>
        </dl>
        <h2 className="mt-8 font-bold">Ingredients</h2>
        <ul className="mt-2 divide-y divide-line">
          {recipe.ingredients.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-2 text-sm">
              <span>{i.name}{i.prep && <span className="text-muted">, {i.prep}</span>}</span>
              <span className="tabular-nums text-muted">{i.quantity} {i.unit}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-3">
          <SaveButton recipe={recipe} />
          <AddToListButton recipe={recipe} />
        </div>
        {locked ? (
          <Link href="/checkout" className="mt-6 flex min-h-14 items-center justify-center rounded-full bg-button font-semibold text-button-ink">Unlock with a free trial</Link>
        ) : (
          <>
            <Link href={`/plan?dish=${recipe.slug}`} className="mt-6 flex min-h-14 items-center justify-center rounded-full border-2 border-button font-semibold">Plan &amp; cook this</Link>
            <Link href={`/recipes/${recipe.slug}/cook`} className="mt-3 flex min-h-14 items-center justify-center rounded-full bg-button font-semibold text-button-ink">Start cook mode</Link>
          </>
        )}
      </aside>
      <section aria-label="Method">
        {locked ? (
          <div className="rounded-3xl border border-line bg-surface p-8">
            <h2 className="text-xl font-bold">This one&apos;s a Premium recipe</h2>
            <p className="mt-2 text-muted">Start a free trial to see the method at your level and cook it hands-free.</p>
          </div>
        ) : (
          <SkillSteps recipe={recipe} initialSkill={viewer.skill} />
        )}
      </section>
    </main>
  );
}
