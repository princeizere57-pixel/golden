"use client";

// Pantry editor (on the Shopping list page) and the meals it suggests (below it, and on Discover).

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useStore } from "@/components/recipe-actions";
import { addPantry, listPantry, removePantry } from "@/lib/device-store";
import { pantrySuggestions } from "@/lib/pantry";

export const usePantry = () => useStore(listPantry, []);

const SUGGESTIONS = ["eggs", "rice", "pasta", "onion", "garlic", "chicken", "tomatoes", "potatoes", "lemon", "cheese", "milk", "beans"];

/**
 * The pantry editor. With `recipes`, the meals it can make show right under it and update as you
 * type, before you even tap Add. `locked` replaces them for plans without Pantry-to-Plate.
 */
export function PantryEditor({ recipes, locked }: { recipes?: PantryRecipe[]; locked?: ReactNode }) {
  const pantry = usePantry();
  const [item, setItem] = useState("");
  return (
    <>
    <section aria-labelledby="pantry" className="rounded-3xl bg-surface p-5">
      <h2 id="pantry" className="text-lg font-semibold">My pantry</h2>
      <p className="mt-1 text-sm text-muted">Tell Golden what you have. Golden suggests meals that use it, and &ldquo;Add to list&rdquo; skips what you already own.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addPantry(item);
          setItem("");
        }}
        className="mt-3 flex gap-2"
      >
        <label htmlFor="pantry-item" className="sr-only">Add an ingredient</label>
        <input id="pantry-item" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. chickpeas" className="min-h-12 flex-1 rounded-xl border border-line bg-bg px-3" />
        <button className="min-h-12 rounded-xl bg-button px-4 font-semibold text-button-ink">Add</button>
      </form>
      <ul className="mt-3 flex flex-wrap gap-2">
        {pantry.map((p) => (
          <li key={p}>
            <button onClick={() => removePantry(p)} className="min-h-10 rounded-full border border-line bg-bg px-3 text-sm" aria-label={`Remove ${p}`}>{p} ✕</button>
          </li>
        ))}
        {SUGGESTIONS.filter((s) => !pantry.includes(s)).slice(0, 8).map((s) => (
          <li key={s}>
            <button onClick={() => addPantry(s)} className="min-h-10 rounded-full border border-dashed border-line px-3 text-sm text-muted">+ {s}</button>
          </li>
        ))}
      </ul>
    </section>
    {locked ?? (recipes && <PantryRail recipes={recipes} inline draft={item} />)}
    </>
  );
}

export interface PantryRecipe {
  slug: string;
  href: string;
  title: string;
  image?: string;
  ingredients: string[];
}

/** Recipes ranked by how much of them the pantry already covers. */
export function PantryRail({ recipes, inline = false, draft = "" }: { recipes: PantryRecipe[]; inline?: boolean; draft?: string }) {
  const saved = usePantry();
  // What's being typed counts too, completed to the commonest ingredient it starts ("chick" →
  // chicken), once it's 3+ letters.
  const typed = completeIngredient(draft, recipes);
  const withTyped = typed && !saved.includes(typed) ? [...saved, typed] : saved;
  const ranked = withTyped.length ? pantrySuggestions(recipes, withTyped) : [];
  const pantry = ranked.length || !saved.length ? withTyped : saved;
  if (!pantry.length) {
    return inline ? (
      <p className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm"><strong>Meals you can make show up here.</strong> Type or tap a few things you have, like eggs, rice or chicken.</p>
    ) : null;
  }
  const shown = ranked.length ? ranked : pantrySuggestions(recipes, pantry);
  if (!shown.length) {
    return inline ? (
      <p className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm">No meal uses these yet. Add a couple more things, like a vegetable, a meat or a tin, and ideas show up here.</p>
    ) : null;
  }
  return (
    <section className={inline ? "-mx-4 mt-4" : "mt-10"} aria-labelledby={inline ? "pantry-meals" : undefined} aria-live={inline ? "polite" : undefined}>
      <div className="mb-3 px-4">
        <h2 id={inline ? "pantry-meals" : undefined} className={inline ? "text-lg font-semibold" : "text-[1.45rem] font-semibold tracking-tight"}>{inline ? "Meals you can make" : "Cook from your pantry"}</h2>
        <p className="text-sm text-muted">
          {inline ? <>Using: <span className="font-medium text-ink">{pantry.join(", ")}</span></> : "Less shopping, less waste: you already have most of these."}
        </p>
      </div>
      <div className={`rail flex overflow-x-auto px-4 pb-1 ${inline ? "gap-3" : "gap-4"}`}>
        {shown.map(({ recipe: r, match: m }) => (
          <Link key={r.slug} href={r.href} className={`block shrink-0 ${inline ? "w-36" : "w-56"}`}>
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- recipe photo
              <img src={r.image} alt="" className={`aspect-square w-full object-cover ${inline ? "rounded-2xl" : "rounded-3xl"}`} loading={inline ? "eager" : "lazy"} />
            ) : (
              <span className={`block aspect-square w-full bg-surface ${inline ? "rounded-2xl" : "rounded-3xl"}`} />
            )}
            <span className={`mt-2 block leading-snug ${inline ? "text-[15px] font-medium" : "text-[17px]"}`}>{r.title}</span>
            <span className="text-sm text-muted">
              {m.missing.length ? `You have ${m.have.length} of ${m.have.length + m.missing.length} · need ${m.missing.slice(0, 2).join(", ")}${m.missing.length > 2 ? "…" : ""}` : "You have everything"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** "chick" → "chicken": the commonest ingredient word starting with what's typed (3+ letters). */
export function completeIngredient(draft: string, recipes: PantryRecipe[]): string | undefined {
  const typed = draft.trim().toLowerCase().replace(/\s+/g, " ");
  if (typed.length < 3) return undefined;
  const counts = new Map<string, number>();
  for (const r of recipes)
    for (const name of r.ingredients)
      for (const word of name.toLowerCase().split(/[^a-z]+/))
        if (word.startsWith(typed.replace(/ /g, ""))) counts.set(word, (counts.get(word) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return best ?? typed;
}
