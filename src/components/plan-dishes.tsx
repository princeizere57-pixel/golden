"use client";

// Plan a meal: pick up to 4 dishes, then work through each one from its own rounded card.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/recipe-actions";
import { MAX_DISHES, planHref } from "@/lib/links";
import { keepOnly, listPlanDone, markPlanDone, unmarkPlanDone } from "@/lib/plan-progress";

export interface DishOption {
  slug: string;
  title: string;
  image?: string;
  minutes: string;
}

/** Grid of dishes at the cook's level; tick up to 4, then plan them together. */
export function DishPicker({ options }: { options: DishOption[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : p.length < MAX_DISHES ? [...p, slug] : p));

  return (
    <>
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {options.map((o) => {
          const on = picked.includes(o.slug);
          const full = !on && picked.length >= MAX_DISHES;
          return (
            <li key={o.slug}>
              <button onClick={() => toggle(o.slug)} disabled={full} aria-pressed={on} className="group block w-full text-left disabled:opacity-40">
                <span className={`relative block overflow-hidden rounded-3xl border-4 ${on ? "border-accent" : "border-transparent"}`}>
                  {o.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- recipe photo, 350 px
                    <img src={o.image} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  ) : (
                    <span className="block aspect-square w-full bg-charcoal" />
                  )}
                  <span className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold ${on ? "border-accent bg-accent text-white" : "border-white bg-black/30 text-white"}`}>
                    {on ? picked.indexOf(o.slug) + 1 : ""}
                  </span>
                </span>
                <span className="mt-2 block leading-snug">{o.title}</span>
                <span className="text-sm text-muted">{o.minutes}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {picked.length > 0 && (
        <div className="sticky bottom-24 z-20 mt-6">
          <button
            onClick={() => {
              keepOnly([]);
              router.push(planHref(picked, picked[0]));
            }}
            className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink shadow-lg"
          >
            Cook {picked.length === 1 ? "this meal" : `these ${picked.length} meals`}
          </button>
        </div>
      )}
    </>
  );
}

/** Rounded cards for the dishes in the plan; tap one to work on it, ticked when finished. */
export function DishCards({ dishes, active }: { dishes: DishOption[]; active: string }) {
  const done = useStore(listPlanDone, []);
  const slugs = dishes.map((d) => d.slug);
  const finished = slugs.filter((s) => done.includes(s)).length;
  const [celebrated, setCelebrated] = useState(false);
  useEffect(() => {
    if (finished === slugs.length && slugs.length > 1) setCelebrated(true);
  }, [finished, slugs.length]);

  return (
    <section aria-label="Dishes in this meal">
      <p className="text-sm font-semibold text-muted">{finished} of {slugs.length} finished</p>
      <ul className="mt-2 space-y-2.5">
        {dishes.map((d) => {
          const isActive = d.slug === active;
          const isDone = done.includes(d.slug);
          return (
            <li key={d.slug}>
              <Link
                href={planHref(slugs, d.slug)}
                aria-current={isActive ? "true" : undefined}
                className={`flex items-center gap-3 rounded-2xl border-2 p-2 pr-4 ${isActive ? "border-accent bg-accent-soft" : isDone ? "border-basil/40 bg-basil/5" : "border-line"}`}
              >
                {d.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- recipe photo
                  <img src={d.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="h-16 w-16 shrink-0 rounded-xl bg-surface" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.title}</span>
                  <span className="text-sm text-muted">{isDone ? "Finished" : isActive ? "Cooking now" : d.minutes}</span>
                </span>
                {isDone ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f9e6e] text-white" aria-label="Finished">✓</span>
                ) : (
                  <span className="shrink-0 text-xl text-muted" aria-hidden>›</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {celebrated && <p role="status" className="mt-3 rounded-2xl bg-basil p-3 text-center font-semibold text-white">Every dish is done. Time to eat! 🍽️</p>}
    </section>
  );
}

/** Lets the cook mark the open dish finished (cook mode's "I made it!" does this too). */
export function FinishDish({ slug, next }: { slug: string; next?: string }) {
  const router = useRouter();
  const done = useStore(listPlanDone, []);
  const isDone = done.includes(slug);
  return isDone ? (
    <button onClick={() => unmarkPlanDone(slug)} className="min-h-12 w-full rounded-full border-2 border-line font-semibold">Finished ✓ (tap to undo)</button>
  ) : (
    <button
      onClick={() => {
        markPlanDone(slug);
        if (next) router.push(next);
      }}
      className="min-h-14 w-full rounded-full border-2 border-button text-lg font-semibold"
    >
      {next ? "Done with this dish, next one" : "Done with this dish"}
    </button>
  );
}
