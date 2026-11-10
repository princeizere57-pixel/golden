import type { Metadata } from "next";
import { MyRecipeCook } from "@/components/my-recipe";
import { LockedPage } from "@/components/plan-lock";
import { can } from "@/lib/billing/entitlements";

import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Cook mode", robots: { index: false } };

export default async function MyRecipeCookPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, viewer] = await Promise.all([params, getViewer()]);
  if (!can(viewer.tier, "cookMode")) return <LockedPage feature="cookMode" heading="Cook mode" back={{ href: `/my/${slug}`, label: "Back to the recipe" }} />;
  return <MyRecipeCook slug={slug} skill={viewer.skill} canFix={can(viewer.tier, "fixMyMistake")} />;
}
