import type { Metadata } from "next";
import { ImportPanel } from "@/components/import-panel";

export const metadata: Metadata = { title: "Import a recipe" };

export default function ImportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Cook any recipe your way</h1>
      <p className="mt-2 text-muted">
        Found a recipe you love on another site? Paste its link and we&apos;ll turn it into steps at your skill level, with timers and Fix My Mistake.
      </p>
      <div className="mt-8">
        <ImportPanel />
      </div>
      <p className="mt-10 text-xs text-muted">
        Imports are for your personal use: they stay private to you, always credit and link to the original, and are never shared or published.
        Please support the creators by visiting their site.
      </p>
    </main>
  );
}
