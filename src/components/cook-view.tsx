"use client";

// OneKit-style execution view: one block at a time, 64 px controls, keyboard arrows,
// parallel timers and a screen wake lock while cooking.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FixMyMistake } from "@/components/fix-my-mistake";
import { SkillSlider } from "@/components/skill-steps";
import { formatClock, useTimers } from "@/components/timers";
import { adaptRecipe } from "@/lib/skill/adapt";
import type { Recipe, SkillLevel } from "@/lib/types";

function useWakeLock() {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock?.request("screen");
        setHeld(Boolean(lock));
        lock?.addEventListener("release", () => setHeld(false));
      } catch {
        setHeld(false);
      }
    };
    const onVisible = () => document.visibilityState === "visible" && acquire();
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);
  return held;
}

export function CookView({ recipe, initialSkill, exitHref = `/recipes/${recipe.slug}` }: { recipe: Recipe; initialSkill: SkillLevel; exitHref?: string }) {
  const [skill, setSkill] = useState(initialSkill);
  const [index, setIndex] = useState(0);
  const { timers, now, start } = useTimers();
  const awake = useWakeLock();
  const steps = adaptRecipe(recipe, skill).steps;
  const step = steps[index];
  const block = recipe.blocks[index];
  const timerId = `${recipe.slug}:${step.blockId}`;
  const running = timers.find((t) => t.id === timerId);
  const last = index === steps.length - 1;

  const go = useCallback((delta: number) => setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + delta))), [steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, button, textarea")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Rough batch volume for Fix My Mistake: liquids plus solids at ~1 ml per gram.
  const volume = recipe.ingredients.reduce((v, i) => v + (i.unit === "ml" || i.unit === "g" ? i.quantity : 0), 0);

  return (
    <div className="cook-mode min-h-[calc(100vh-57px)] px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <Link href={exitHref} className="inline-flex min-h-16 items-center underline">Exit cook mode</Link>
          <span className="text-muted">{awake ? "Screen stays on" : "Screen may sleep"}</span>
        </div>
        <SkillSlider value={skill} onChange={setSkill} />

        <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-label="Progress">
          <div className="h-full bg-accent transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>

        <article aria-live="polite" className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Step {index + 1} of {steps.length} · {block.kind === "heat" ? `${block.heat} heat` : block.kind === "prep" ? "prep" : "timer"}
          </p>
          <ul className="mt-4 space-y-3 text-2xl font-medium leading-snug sm:text-3xl">
            {step.instructions.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
          {step.notes.length > 0 && <ul className="mt-6 space-y-1 text-lg text-muted">{step.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}

          {(step.kind === "timing" || step.attention === "passive") && (
            <button
              onClick={() => start({ id: timerId, label: step.timerLabel ?? `Step ${index + 1}`, recipeSlug: recipe.slug }, step.minutes)}
              className="mt-8 min-h-16 w-full rounded-2xl border-2 border-accent text-xl font-bold"
            >
              {running ? `Restart timer (${running.endsAt > now ? formatClock(running.endsAt - now) : "done"})` : `Start ${step.minutes} min timer`}
            </button>
          )}
        </article>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => go(-1)} disabled={index === 0} className="min-h-16 rounded-2xl border border-line text-xl font-bold disabled:opacity-40">Back</button>
          {last ? (
            <Link href="/" className="flex min-h-16 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-accent-ink">Done. Enjoy!</Link>
          ) : (
            <button onClick={() => go(1)} className="min-h-16 rounded-2xl bg-accent text-xl font-bold text-accent-ink">Next</button>
          )}
        </div>
      </div>
      <FixMyMistake slug={recipe.slug} defaultVolumeMl={Math.max(250, Math.round(volume / 50) * 50)} />
    </div>
  );
}
