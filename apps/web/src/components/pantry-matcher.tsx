"use client";

// Pantry-to-Plate Matcher: the cook says what's left in the fridge, Golden cross-references every
// recipe instantly and sends them straight to the best meal (or lets them pick from the matches).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { usePantry, type PantryRecipe } from "@/components/pantry";
import { track } from "@/lib/analytics";
import { addPantry } from "@/lib/device-store";
import { planHref } from "@/lib/links";
import { parseFridge, rankMeals } from "@/lib/pantry";

const EXAMPLE = "2 eggs, half an onion, leftover rice, spinach, garlic";

export function PantryMatcher({ recipes }: { recipes: PantryRecipe[] }) {
  const router = useRouter();
  const saved = usePantry();
  const [text, setText] = useState("");
  const [useSaved, setUseSaved] = useState(true);

  const typed = useMemo(() => parseFridge(text), [text]);
  const fridge = useMemo(() => [...new Set([...typed, ...(useSaved ? saved : [])])], [typed, saved, useSaved]);
  const ranked = useMemo(() => rankMeals(recipes, fridge), [recipes, fridge]);
  const best = ranked[0];
  const instant = ranked.filter((m) => m.instant);
  const almost = ranked.filter((m) => !m.instant && m.match.missing.length <= 2).slice(0, 12);

  function goToBest() {
    if (!best) return;
    track("pantry_match", { recipe: best.recipe.slug, items: fridge.length, instant: best.instant });
    router.push(best.recipe.href);
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToBest();
        }}
        className="mt-5 rounded-3xl bg-surface p-5"
      >
        <label htmlFor="fridge" className="text-lg font-semibold">What&apos;s left in your fridge?</label>
        <p className="mt-1 text-sm text-muted">Type it the way you&apos;d say it. Golden checks every recipe as you type.</p>
        <textarea
          id="fridge"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              goToBest();
            }
          }}
          rows={3}
          placeholder={`e.g. ${EXAMPLE}`}
          className="mt-3 w-full rounded-2xl border border-line bg-bg p-3 text-[17px]"
        />
        {!text && (
          <button type="button" onClick={() => setText(EXAMPLE)} className="mt-1 min-h-11 text-sm font-medium underline">Try an example</button>
        )}

        {fridge.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Ingredients Golden is matching">
            {fridge.map((f) => <li key={f} className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm capitalize">{f}</li>)}
          </ul>
        )}

        {saved.length > 0 && (
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={useSaved} onChange={(e) => setUseSaved(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
            Also use my saved pantry ({saved.length} item{saved.length === 1 ? "" : "s"})
          </label>
        )}

        <button disabled={!best} className="mt-4 min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-50">
          {best ? `Take me to my best meal: ${best.recipe.title}` : fridge.length ? "Add a few more ingredients" : "Tell Golden what you have"}
        </button>
        {typed.length > 0 && (
          <button type="button" onClick={() => typed.forEach((t) => addPantry(t))} className="mt-2 min-h-11 w-full text-sm font-medium">
            Save these to my pantry
          </button>
        )}
      </form>

      {fridge.length > 0 && !ranked.length && (
        <p className="mt-6 rounded-2xl bg-accent-soft p-4">No close matches yet. Add a couple more things, like a grain, an egg or a vegetable.</p>
      )}

      {instant.length > 0 && <MealList title="Ready right now" note="You have everything except basics like salt and oil." meals={instant.slice(0, 12)} />}
      {almost.length > 0 && <MealList title="Almost there" note="Just one or two things to pick up." meals={almost} />}
    </>
  );
}

function MealList({ title, note, meals }: { title: string; note: string; meals: ReturnType<typeof rankMeals<PantryRecipe>> }) {
  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted">{note}</p>
      <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {meals.map(({ recipe: r, match: m }) => (
          <li key={r.slug}>
            <Link href={r.href} className="block">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- recipe photo
                <img src={r.image} alt="" loading="lazy" className="aspect-square w-full rounded-3xl object-cover" />
              ) : (
                <span className="block aspect-square w-full rounded-3xl bg-surface" />
              )}
              <span className="mt-2 block leading-snug">{r.title}</span>
              <span className="text-sm text-muted">
                Uses {m.have.length} of your items{m.missing.length ? ` · need ${m.missing.slice(0, 2).join(", ")}` : ""}
              </span>
            </Link>
            <Link href={planHref([r.slug], r.slug)} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold underline">Plan &amp; cook</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
