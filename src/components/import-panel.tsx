"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { importRecipeAction } from "@/app/actions/import";
import { SourcePhoto } from "@/components/source-photo";
import { listImports, removeImport, saveImport } from "@/lib/import/store";
import type { Recipe } from "@/lib/types";

export function ImportPanel() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imports, setImports] = useState<Recipe[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => setImports(listImports()), []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await importRecipeAction(link);
      if (!result.ok) return setError(result.error);
      saveImport(result.recipe);
      router.push(`/my/${result.recipe.slug}`);
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="link" className="sr-only">Recipe link</label>
        <input
          id="link"
          type="url"
          required
          inputMode="url"
          placeholder="https://… paste a recipe page link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="min-h-14 flex-1 rounded-2xl border border-line bg-surface px-4 text-base"
        />
        <button disabled={pending} className="min-h-14 rounded-2xl bg-accent px-6 font-bold text-accent-ink disabled:opacity-60">
          {pending ? "Importing…" : "Import"}
        </button>
      </form>
      <p className="mt-2 h-5 text-sm" role="alert">{error && <span className="text-tomato">{error}</span>}</p>

      <h2 className="mt-8 text-xl font-bold">Your imports</h2>
      {imports.length === 0 ? (
        <p className="mt-2 text-muted">Nothing yet. Imported recipes are saved on this device only.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-surface">
          {imports.map((r) => (
            <li key={r.slug} className="flex items-center gap-4 p-4">
              <SourcePhoto recipe={r} credit={false} className="h-16 w-16 shrink-0" />
              <Link href={`/my/${r.slug}`} className="min-h-11 flex-1">
                <span className="block font-semibold">{r.title}</span>
                <span className="text-sm text-muted">from {r.source?.name}</span>
              </Link>
              <button
                onClick={() => {
                  removeImport(r.slug);
                  setImports(listImports());
                }}
                className="min-h-11 rounded-full px-3 text-sm underline"
                aria-label={`Remove ${r.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
