import type { Metadata } from "next";
import { MyRecipeCook } from "@/components/my-recipe";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Cook mode", robots: { index: false } };

export default async function MyRecipeCookPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, viewer] = await Promise.all([params, getViewer()]);
  return <MyRecipeCook slug={slug} skill={viewer.skill} />;
}
