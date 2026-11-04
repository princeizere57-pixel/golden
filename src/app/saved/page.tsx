import type { Metadata } from "next";
import { SavedGrid } from "@/components/recipe-actions";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <main className="mx-auto px-4 pb-10 pt-6">
      <h1 className="font-display text-[2.3rem]">Saved</h1>
      <p className="mt-2 text-muted">Recipes you&apos;ve saved, on this device.</p>
      <SavedGrid />
    </main>
  );
}
