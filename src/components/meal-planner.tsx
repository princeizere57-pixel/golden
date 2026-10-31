"use client";

// Multi-dish timing orchestrator: pick dishes, see one timeline where they all finish together,
// then run it. Each task start fires a Web Audio chime and a phone vibration.

import { useEffect, useMemo, useRef, useState } from "react";
import { chime } from "@/components/timers";
import { orchestrate } from "@/lib/timing/orchestrate";
import type { Recipe } from "@/lib/types";

export function MealPlanner({ recipes }: { recipes: Pick<Recipe, "slug" | "title" | "blocks">[] }) {
  const [chosen, setChosen] = useState<string[]>(recipes.map((r) => r.slug));
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const alerted = useRef(new Set<string>());

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

  const running = startedAt !== null;
  const elapsedMin = running ? (now - startedAt) / 60000 : 0;
  const finished = running && elapsedMin >= schedule.totalMinutes;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  // Alert as each task's start time arrives, and once more when everything is ready.
  useEffect(() => {
    if (!running) return;
    for (const t of schedule.tasks) {
      if (elapsedMin >= t.start && !alerted.current.has(t.id)) {
        alerted.current.add(t.id);
        chime();
      }
    }
    if (finished && !alerted.current.has("serve")) {
      alerted.current.add("serve");
      chime([300, 120, 300, 120, 500]);
    }
  }, [elapsedMin, running, finished, schedule.tasks]);

  function start() {
    alerted.current = new Set();
    const t = Date.now();
    setNow(t);
    setStartedAt(t);
  }

  const current = schedule.tasks.filter((t) => elapsedMin >= t.start && elapsedMin < t.end);
  const next = schedule.tasks.find((t) => t.start > elapsedMin);

  return (
    <div>
      <fieldset className="flex flex-wrap gap-2" disabled={running}>
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

          {running ? (
            <div className="sticky top-2 z-10 mt-4 rounded-3xl bg-charcoal p-5 text-white" aria-live="polite">
              {finished ? (
                <p className="text-2xl font-bold">Everything&apos;s ready. Serve it hot! 🍽️</p>
              ) : (
                <>
                  <p className="font-mono text-4xl tabular-nums">{fmt(elapsedMin)} <span className="text-base text-white/60">/ {fmt(schedule.totalMinutes)}</span></p>
                  <p className="mt-2 text-sm text-white/70">Now:</p>
                  <ul className="mt-1 space-y-1">{current.map((t) => <li key={t.id} className="font-semibold">{t.dish}: {t.label}</li>)}</ul>
                  {next && <p className="mt-3 text-sm text-white/80">Next in {fmt(next.start - elapsedMin)}: {next.dish}: {next.label}</p>}
                </>
              )}
              <button onClick={() => setStartedAt(null)} className="mt-4 min-h-11 rounded-full bg-white/15 px-4 text-sm font-semibold">{finished ? "Done" : "Stop"}</button>
            </div>
          ) : (
            <button onClick={start} className="mt-4 min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Start cooking: chimes &amp; vibration on</button>
          )}

          <ol className="mt-4 space-y-2">
            {schedule.tasks.map((t) => {
              const state = !running ? "" : elapsedMin >= t.end ? "opacity-50" : elapsedMin >= t.start ? "border-accent bg-accent-soft" : "";
              return (
                <li key={t.id} className={`grid grid-cols-[5rem_1fr] gap-3 rounded-2xl border border-line bg-surface p-4 ${state}`}>
                  <span className="font-mono text-sm tabular-nums text-muted">{fmt(t.start)}–{fmt(t.end)}</span>
                  <span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t.dish} · {t.attention === "active" ? "hands-on" : "hands-off"}</span>
                    <span className="block">{t.label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

const fmt = (m: number) => {
  const total = Math.max(0, Math.round(m * 60));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
