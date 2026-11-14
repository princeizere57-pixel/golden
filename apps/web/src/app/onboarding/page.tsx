import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getUser } from "@/lib/auth";
import { catalogue } from "@/lib/catalogue";
import { libraryRecipes } from "@/lib/library";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Find your level" };

/** Step 2 of first run: after sign-in, Golden asks its questions; checkout follows. */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/signin");
  const images = [...(await catalogue()), ...libraryRecipes().slice(0, 6)].flatMap((r) => (r.image ? [thumb(r.image)] : [])).slice(0, 5);
  return <OnboardingFlow images={images} userName={user.name.split(" ")[0]} />;
}
