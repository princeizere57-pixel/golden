import type { Metadata } from "next";
import { MealPlanner } from "@/components/meal-planner";
import { RECIPES } from "@/lib/data/recipes";
import { libraryRecipes } from "@/lib/library";

export const metadata: Metadata = { title: "Plan a meal" };

export default function PlanPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Plan a meal</h1>
      <p className="mt-2 text-muted">Pick the dishes you&apos;re making and we&apos;ll schedule them to land on the table together.</p>
      <div className="mt-8">
        <MealPlanner recipes={[...RECIPES, ...libraryRecipes().slice(0, 10)].map(({ slug, title, blocks }) => ({ slug, title, blocks }))} />
      </div>
    </main>
  );
}
