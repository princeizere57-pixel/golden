"use client";

import { useMemo, useState } from "react";
import { orchestrate } from "@/lib/timing/orchestrate";
import type { Recipe } from "@/lib/types";

/** Pick dishes; see one timeline where they all finish together. */
export function MealPlanner({ recipes }: { recipes: Pick<Recipe, "slug" | "title" | "blocks">[] }) {
  const [chosen, setChosen] = useState<string[]>(recipes.slice(0, 2).map((r) => r.slug));
  const schedule = useMemo(
    () =>
      orchestrate(
        recipes
          .filter((r) => chosen.includes(r.slug))
          .map((r) => r.blocks.map((b) => ({ id: `${r.slug}:${b.id}`, dish: r.title, label: b.text, minutes: b.minutes, attention: b.attention }))),
      ),
    [recipes, chosen],
  );
  const toggle = (slug: string) => setChosen((c) => (c.includes(slug) ? c.filter((s) => s !== slug) : [...c, slug]));

  return (
    <div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 font-semibold">Dishes</legend>
        {recipes.map((r) => (
          <label key={r.slug} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${chosen.includes(r.slug) ? "border-button bg-button text-button-ink" : "border-line bg-surface"}`}>
            <input type="checkbox" className="sr-only" checked={chosen.includes(r.slug)} onChange={() => toggle(r.slug)} />
            {r.title}
          </label>
        ))}
      </fieldset>
      {schedule.tasks.length > 0 && (
        <>
          <p className="mt-6 text-lg">Everything is ready in <strong>{Math.ceil(schedule.totalMinutes)} minutes</strong>. Only one hands-on task at a time.</p>
          <ol className="mt-4 space-y-2">
            {schedule.tasks.map((t) => (
              <li key={t.id} className="grid grid-cols-[5rem_1fr] gap-3 rounded-2xl border border-line bg-surface p-4">
                <span className="font-mono text-sm tabular-nums text-muted">{fmt(t.start)}–{fmt(t.end)}</span>
                <span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t.dish} · {t.attention === "active" ? "hands-on" : "hands-off"}</span>
                  <span className="block">{t.label}</span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

const fmt = (m: number) => `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}`;
