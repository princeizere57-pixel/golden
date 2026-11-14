import { redirect } from "next/navigation";
import { surpriseRecipe } from "@/lib/library";
import { recipeHref } from "@/lib/links";
import { getViewer } from "@/lib/viewer";

// "Surprise me": a different random dish at your level on every tap.
export const dynamic = "force-dynamic";

export default async function SurprisePage() {
  const { skill } = await getViewer();
  const recipe = await surpriseRecipe(skill);
  redirect(recipe ? recipeHref(recipe) : "/explore");
}
