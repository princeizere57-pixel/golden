import type { Metadata } from "next";
import { ShoppingList } from "@/components/shopping-list";

export const metadata: Metadata = { title: "Shopping list" };

export default function ShoppingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-6">
      <h1 className="font-display text-[2.3rem]">Shopping list</h1>
      <ShoppingList />
    </main>
  );
}
