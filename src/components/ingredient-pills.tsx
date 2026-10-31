"use client";

// Ingredients as pill-shaped rows, each led by a picture of the ingredient.

import { useState } from "react";
import { usePantry } from "@/components/pantry";
import { covers } from "@/lib/pantry";
import { ingredientIconUrl } from "@/lib/ingredient-icons";
import type { Ingredient } from "@/lib/types";

function Icon({ ing }: { ing: Ingredient }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl">🥄</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- TheMealDB ingredient picture
    <img src={ingredientIconUrl(ing)} alt="" width={48} height={48} loading="lazy" onError={() => setFailed(true)} className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.18)]" />
  );
}

const amountOf = (i: Ingredient) => {
  if (i.raw) return i.raw.replace(new RegExp(`\\s*${(i.icon ?? i.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim() || "to taste";
  return i.quantity ? `${i.quantity} ${i.unit === "pc" ? "" : i.unit}`.trim() : "to taste";
};

export function IngredientPills({ ingredients }: { ingredients: Ingredient[] }) {
  const pantry = usePantry();
  return (
    <ul className="space-y-2.5">
      {ingredients.map((i) => {
        const owned = pantry.some((p) => covers(p, i.icon ?? i.name));
        return (
          <li key={i.id} className={`flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-5 ${owned ? "border-basil/40 bg-basil/5" : "border-line bg-bg"}`}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface"><Icon ing={i} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold capitalize">{i.icon ?? i.name}</span>
              {i.prep && <span className="block truncate text-xs text-muted">{i.prep}</span>}
            </span>
            <span className="shrink-0 text-sm font-medium text-muted">{amountOf(i)}</span>
            {owned && <span className="shrink-0 text-xs font-semibold text-basil">In pantry</span>}
          </li>
        );
      })}
    </ul>
  );
}
