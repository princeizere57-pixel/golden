import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getUser } from "@/lib/auth";
import { RECIPES } from "@/lib/data/recipes";
import { libraryRecipes } from "@/lib/library";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Find your level" };

/** Step 2 of first run: after sign-in, the Chef's AI asks its questions; checkout follows. */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/signin");
  const images = [...RECIPES, ...libraryRecipes().slice(0, 6)].flatMap((r) => (r.image ? [thumb(r.image)] : [])).slice(0, 5);
  return <OnboardingFlow images={images} userName={user.name.split(" ")[0]} />;
}
