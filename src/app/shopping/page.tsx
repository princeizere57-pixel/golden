import type { Metadata } from "next";
import { PantryEditor, PantryRail } from "@/components/pantry";
import { PlanLock } from "@/components/plan-lock";
import { ShoppingList } from "@/components/shopping-list";
import { can } from "@/lib/billing/entitlements";
import { pantryRecipes } from "@/lib/library";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Shopping list" };

export default async function ShoppingPage() {
  const { tier } = await getViewer();
  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <h1 className="font-display text-[2.3rem]">Shopping list</h1>
      {can(tier, "shoppingList") ? (
        <>
          <div className="mt-6"><PantryEditor /></div>
          {can(tier, "pantry") ? <PantryRail recipes={pantryRecipes()} inline /> : <div className="mt-4"><PlanLock feature="pantry" compact /></div>}
          <ShoppingList />
        </>
      ) : (
        <PlanLock feature="shoppingList" back={{ href: "/explore", label: "Browse recipes" }} />
      )}
    </main>
  );
}
