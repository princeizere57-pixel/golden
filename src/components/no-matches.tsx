"use client";

// Shown when a search finds nothing in Golden's library or TheMealDB: Golden offers to write an
// original recipe for that dish (Gemini, saved privately like an import), or to import one
// recipe page from a link. Either way the cook ends up in the same cook mode.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateRecipeAction } from "@/app/actions/import";
import { saveImport } from "@/lib/import/store";
import { unlockHref } from "@/components/plan-lock";
import { ClawMark } from "@/components/claw-loader";

/** `canWrite`: recipe writing is part of Executive; other plans see it with the plan that unlocks it. */
export function NoMatches({ query, canWrite }: { query: string; canWrite: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [pending, start] = useTransition();

  function write() {
    setError(null);
    start(async () => {
      const result = await generateRecipeAction(query);
      if (result.ok) {
        saveImport(result.recipe);
        router.push(`/my/${result.recipe.slug}`);
        return;
      }
      if (result.reason === "sign-in") {
        router.push("/signin");
        return;
      }
      setUnavailable(result.reason === "unavailable");
      setError(result.error);
    });
  }

  return (
    <section className="mt-8 rounded-3xl bg-surface p-6" aria-live="polite">
      <h2 className="text-xl font-bold">No &ldquo;{query}&rdquo; in the library yet</h2>
      <p className="mt-1 text-muted">Golden can write you an original recipe for it, ready for cook mode at your level, in about 15 seconds.</p>
      {!canWrite ? (
        <Link href={unlockHref("recipeWriter")} className="mt-4 flex min-h-14 w-full flex-col items-center justify-center rounded-full bg-button font-semibold leading-tight text-button-ink">
          Write a recipe for &ldquo;{query}&rdquo;
          <span className="text-xs font-medium">Part of Executive · 3 days free</span>
        </Link>
      ) : !unavailable && (
        <button onClick={write} disabled={pending} className="mt-4 min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-70">
          {pending ? <span className="inline-flex items-center gap-2"><ClawMark size={30} />Writing your recipe…</span> : `Write a recipe for “${query}”`}
        </button>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-tomato">{error}</p>}
      <Link href="/import" className="mt-3 flex min-h-12 items-center justify-center rounded-full border-2 border-button font-semibold">
        Have a link? Import that recipe
      </Link>
      <p className="mt-3 text-xs text-muted">Recipes written or imported for you stay private on this device.</p>
    </section>
  );
}
