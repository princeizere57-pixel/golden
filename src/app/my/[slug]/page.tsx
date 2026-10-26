import type { Metadata } from "next";
import { MyRecipe } from "@/components/my-recipe";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "My recipe", robots: { index: false } };

export default async function MyRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, viewer] = await Promise.all([params, getViewer()]);
  return <MyRecipe slug={slug} skill={viewer.skill} />;
}
