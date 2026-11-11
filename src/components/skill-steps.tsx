"use client";

// Skill slider: changing level re-renders instantly with the deterministic engine, then swaps
// in the AI rewrite if one comes back.

import { useState, useTransition } from "react";
import { adaptRecipeAction } from "@/app/actions/adapt";
import { setSkill } from "@/app/actions/viewer";
import { adaptRecipe } from "@/lib/skill/adapt";
import { SKILL_LEVELS, type AdaptedRecipe, type Recipe, type SkillLevel } from "@/lib/types";

const LABEL: Record<SkillLevel, string> = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
const KIND: Record<string, string> = { prep: "Prep", heat: "Heat", timing: "Timer" };

export function SkillSlider({ value, onChange }: { value: SkillLevel; onChange: (s: SkillLevel) => void }) {
  const index = SKILL_LEVELS.indexOf(value);
  return (
    <div>
      <label htmlFor="skill" className="text-sm font-semibold">Skill level: {LABEL[value]}</label>
      <input
        id="skill"
        type="range"
        min={0}
        max={SKILL_LEVELS.length - 1}
        step={1}
        value={index}
        aria-valuetext={LABEL[value]}
        onChange={(e) => onChange(SKILL_LEVELS[Number(e.target.value)])}
        className="mt-2 h-11 w-full accent-[var(--accent)]"
      />
      <div className="flex justify-between text-xs text-muted" aria-hidden>
        {SKILL_LEVELS.map((s) => <span key={s}>{LABEL[s]}</span>)}
      </div>
    </div>
  );
}

/** A step's transparent picture, or nothing. Decorative: the step text says the same thing. */
export function StepPicture({ src, className = "" }: { src?: string; className?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element -- small transparent WebP from public/steps
  return <img src={src} alt="" loading="lazy" width={512} height={512} className={`object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] ${className}`} />;
}

export function SkillSteps({ recipe, initialSkill }: { recipe: Recipe; initialSkill: SkillLevel }) {
  const [adapted, setAdapted] = useState<AdaptedRecipe>(() => adaptRecipe(recipe, initialSkill));
  const [pending, startTransition] = useTransition();

  function change(skill: SkillLevel) {
    setAdapted(adaptRecipe(recipe, skill));
    startTransition(async () => {
      await setSkill(skill);
      const ai = await adaptRecipeAction(recipe.slug, skill);
      if (ai) setAdapted((current) => (current.skill === skill ? ai : current));
    });
  }

  return (
    <div>
      <SkillSlider value={adapted.skill} onChange={change} />
      <p className="mt-2 h-5 text-xs text-muted" aria-live="polite">
        {pending ? "Rewriting for your level…" : adapted.source === "ai" ? "Rewritten by AI for your level" : ""}
      </p>
      <ol className="mt-4 space-y-4">
        {adapted.steps.map((step, i) => (
          <li key={step.blockId} className="flow-root rounded-2xl border border-line bg-surface p-5">
            <StepPicture src={recipe.blocks.find((b) => b.id === step.blockId)?.picture} className="float-right -mr-1 -mt-1 ml-3 h-24 w-24" />
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Step {i + 1}</span>
              <span>· {KIND[step.kind]}</span>
              <span>· {step.minutes} min</span>
              {step.attention === "passive" && <span className="rounded-full bg-basil px-2 py-0.5 text-white normal-case">hands-off</span>}
            </div>
            <ul className="space-y-1.5">
              {step.instructions.map((line, j) => <li key={j}>{line}</li>)}
            </ul>
            {step.notes.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
                {step.notes.map((n, j) => <li key={j}>{n}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
