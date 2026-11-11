"use client";

// Pantry editor (on the Shopping list page) and the meals it suggests (below it, and on Discover).

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/recipe-actions";
import { addPantry, listPantry, removePantry } from "@/lib/device-store";
import { pantrySuggestions } from "@/lib/pantry";

export const usePantry = () => useStore(listPantry, []);

const SUGGESTIONS = ["eggs", "rice", "pasta", "onion", "garlic", "chicken", "tomatoes", "potatoes", "lemon", "cheese", "milk", "beans"];

export function PantryEditor() {
  const pantry = usePantry();
  const [item, setItem] = useState("");
  return (
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
export function PantryRail({ recipes, inline = false }: { recipes: PantryRecipe[]; inline?: boolean }) {
  const pantry = usePantry();
  if (!pantry.length) return null;
  const ranked = pantrySuggestions(recipes, pantry);
  if (!ranked.length) {
    return inline ? (
      <p className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm">No meal uses these yet. Add a couple more things, like a vegetable, a meat or a tin, and ideas show up here.</p>
    ) : null;
  }
  return (
    <section className={inline ? "-mx-4 mt-6" : "mt-10"} aria-labelledby={inline ? "pantry-meals" : undefined}>
      <div className="mb-3 px-4">
        <h2 id={inline ? "pantry-meals" : undefined} className="text-[1.45rem] font-semibold tracking-tight">{inline ? "Meals you can make" : "Cook from your pantry"}</h2>
        <p className="text-sm text-muted">Less shopping, less waste: these use what you already have.</p>
      </div>
      <div className="rail flex gap-4 overflow-x-auto px-4 pb-1">
        {ranked.map(({ recipe: r, match: m }) => (
          <Link key={r.slug} href={r.href} className="block w-56 shrink-0">
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- recipe photo
              <img src={r.image} alt="" className="aspect-square w-full rounded-3xl object-cover" loading="lazy" />
            ) : (
              <span className="block aspect-square w-full rounded-3xl bg-surface" />
            )}
            <span className="mt-2.5 block text-[17px] leading-snug">{r.title}</span>
            <span className="text-sm text-muted">
              {m.missing.length ? `You have ${m.have.length} of ${m.have.length + m.missing.length} · need ${m.missing.slice(0, 2).join(", ")}${m.missing.length > 2 ? "…" : ""}` : "You have everything"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
