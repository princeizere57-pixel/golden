// Shown when a search finds nothing in Golden's library or TheMealDB: one clear next step
// (import that recipe from a link, kept private like every import), or keep browsing.

import Link from "next/link";

export function NoMatches({ query }: { query: string }) {
  return (
    <section className="mt-8 rounded-3xl bg-surface p-6">
      <h2 className="text-xl font-bold">No &ldquo;{query}&rdquo; in the library yet</h2>
      <p className="mt-1 text-muted">Found it on another site? Paste the link and Golden turns it into steps at your level, with timers and cook mode.</p>
      <Link href="/import" className="mt-4 flex min-h-14 items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">
        Import a recipe from a link
      </Link>
      <Link href="/explore" className="mt-2 flex min-h-12 items-center justify-center font-medium underline">Browse every recipe</Link>
      <p className="mt-3 text-xs text-muted">Imported recipes stay private on this device.</p>
    </section>
  );
}
