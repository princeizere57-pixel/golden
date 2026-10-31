"use client";

// Full-screen onboarding: one question per screen with a progress bar, then a short
// "building your skill path" step and the level result. Checkout comes next (/checkout).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveOnboarding } from "@/app/actions/viewer";
import { MiniYou } from "@/components/mini-you";
import { PhotoCapture } from "@/components/photo-capture";
import { track } from "@/lib/analytics";
import { LEVEL_PITCH, QUESTIONS, prefsFromAnswers, skillFromAnswers, type Answers } from "@/lib/skill/quiz";

const BUILD_LINES = ["Reading your answers…", "Matching techniques to your level…", "Picking your first recipes…", "Setting up cook mode…"];

type Stage = { kind: "mini" } | { kind: "question"; index: number } | { kind: "building" } | { kind: "result" };

export function OnboardingFlow({ images, userName }: { images: string[]; userName: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "mini" });
  const [answers, setAnswers] = useState<Answers>({});
  const [line, setLine] = useState(0);
  const { skill } = skillFromAnswers(answers);

  const steps = QUESTIONS.length + 3;
  const position = stage.kind === "mini" ? 0 : stage.kind === "question" ? stage.index + 1 : stage.kind === "building" ? QUESTIONS.length + 1 : QUESTIONS.length + 2;
  const progress = ((position + 1) / steps) * 100;

  useEffect(() => {
    if (stage.kind !== "building") return;
    saveOnboarding({ skill, ...prefsFromAnswers(answers) });
    track("onboarding_completed", { skill });
    const tick = setInterval(() => setLine((l) => Math.min(BUILD_LINES.length - 1, l + 1)), 700);
    const done = setTimeout(() => setStage({ kind: "result" }), 2900);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [stage.kind, skill, answers]);

  function back() {
    if (stage.kind === "question" && stage.index > 0) setStage({ kind: "question", index: stage.index - 1 });
    else if (stage.kind === "question") setStage({ kind: "mini" });
    else if (stage.kind === "mini") router.push("/signin");
    else setStage({ kind: "question", index: QUESTIONS.length - 1 });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-6 pt-4">
      <div className="flex items-center gap-4">
        <button onClick={back} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <Link href={stage.kind === "result" ? "/" : "/welcome"} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </Link>
      </div>

      {stage.kind === "mini" && (
        <section className="step-in flex flex-1 flex-col">
          <h1 className="mt-6 font-display text-[2.1rem]">
            First, let&apos;s make <span className="text-accent">your Mini You</span>
          </h1>
          <p className="mt-2 text-muted">Your cooking buddy celebrates your wins and keeps you going when things go wrong.</p>
          <div className="mt-5 flex flex-1 flex-col">
            <PhotoCapture onDone={() => setStage({ kind: "question", index: 0 })} onSkip={() => setStage({ kind: "question", index: 0 })} />
          </div>
        </section>
      )}

      {stage.kind === "question" && (
        <QuestionStep
          key={stage.index}
          intro={stage.index === 0 ? `Hi ${userName}! I'm The Chef's Golden, your cooking coach. A few quick questions so I can coach you at exactly the right level.` : undefined}
          index={stage.index}
          answers={answers}
          onChange={setAnswers}
          onNext={() => setStage(stage.index + 1 < QUESTIONS.length ? { kind: "question", index: stage.index + 1 } : { kind: "building" })}
        />
      )}

      {stage.kind === "building" && (
        <section className="step-in flex flex-1 flex-col items-center justify-center text-center" aria-live="polite">
          <h1 className="font-display text-[2.1rem]">
            Building a skill path <span className="text-accent">just for you</span>
          </h1>
          <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent" style={{ animation: "fill 2.8s ease-in-out forwards" }} />
          </div>
          <p className="mt-6 text-muted">{BUILD_LINES[line]}</p>
        </section>
      )}

      {stage.kind === "result" && (
        <section className="step-in flex flex-1 flex-col">
          <h1 className="mt-8 font-display text-[2.1rem]">
            You&apos;re cooking at <span className="text-accent">{LEVEL_PITCH[skill].name}</span> level
          </h1>
          <p className="mt-3 text-muted">Every recipe will be rewritten for you. Change your level any time.</p>
          <PhoneMock images={images} level={LEVEL_PITCH[skill].name} />
          <ul className="mt-6 space-y-2">
            {LEVEL_PITCH[skill].lines.map((l) => (
              <li key={l} className="flex gap-2"><Check />{l}</li>
            ))}
          </ul>
          <button onClick={() => router.push("/checkout")} className="mt-auto min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">I&apos;m ready</button>
        </section>
      )}

    </main>
  );
}

function QuestionStep({ index, intro, answers, onChange, onNext }: { index: number; intro?: string; answers: Answers; onChange: (a: Answers) => void; onNext: () => void }) {
  const q = QUESTIONS[index];
  const chosen = answers[q.id] ?? [];
  const canContinue = q.multi || chosen.length > 0;

  function pick(id: string) {
    const next = q.multi ? (chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]) : [id];
    onChange({ ...answers, [q.id]: next });
  }

  return (
    <section className="step-in flex flex-1 flex-col">
      {intro && (
        <div className="mt-6 flex items-start gap-3">
          <span className="shrink-0 overflow-hidden rounded-full bg-accent-soft"><MiniYou headOnly size={52} mood="happy" /></span>
          <p className="rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-[15px]">{intro}</p>
        </div>
      )}
      <h1 className={`${intro ? "mt-6" : "mt-8"} font-display text-[2.1rem]`}>
        {q.title[0]}<span className="text-accent">{q.title[1]}</span>{q.title[2]}
      </h1>
      {q.hint && <p className="mt-3 text-muted">{q.hint}</p>}
      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">{q.title.join("")}</legend>
        {q.options.map((o) => {
          const on = chosen.includes(o.id);
          return (
            <label key={o.id} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors ${on ? "border-accent bg-accent-soft" : "border-line hover:border-muted/40"}`}>
              <input type={q.multi ? "checkbox" : "radio"} name={q.id} checked={on} onChange={() => pick(o.id)} className="sr-only" />
              <span aria-hidden className="text-xl">{o.emoji}</span>
              <span className="flex-1 text-[17px]">{o.label}</span>
              <span aria-hidden className={`flex h-6 w-6 items-center justify-center border-2 ${q.multi ? "rounded-md" : "rounded-full"} ${on ? "border-accent bg-accent text-white" : "border-line"}`}>
                {on && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>}
              </span>
            </label>
          );
        })}
      </fieldset>
      <button
        onClick={onNext}
        disabled={!canContinue}
        className="mt-auto min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink transition-colors disabled:bg-line disabled:text-muted"
      >
        Continue
      </button>
    </section>
  );
}

function Check() {
  return (
    <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-basil text-white">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>
    </span>
  );
}

/** A phone outline previewing the personalised feed. */
export function PhoneMock({ images, level }: { images: string[]; level: string }) {
  return (
    <div aria-hidden className="mx-auto mt-6 w-60 rounded-[2.2rem] border-[6px] border-button bg-bg p-3 shadow-xl">
      <div className="mx-auto mb-3 h-4 w-20 rounded-full bg-button" />
      <div className="rounded-full border border-line px-3 py-1.5 text-[10px] text-muted">Search recipes, techniques…</div>
      <p className="mt-3 text-[11px] font-semibold">Picked for {level} cooks</p>
      <div className="mt-2 flex gap-2 overflow-hidden">
        {images.slice(0, 2).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- decorative TheMealDB photo
          <img key={src} src={src} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
        ))}
      </div>
      <p className="mt-3 text-[11px] font-semibold">Your technique this week</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {images.slice(2, 5).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- decorative TheMealDB photo
          <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
        ))}
      </div>
    </div>
  );
}
