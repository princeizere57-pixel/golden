"use client";

import { useState, useTransition } from "react";
import { fixMistakeAction } from "@/app/actions/adapt";
import { MISTAKES, fixMistake, type Fix, type MistakeId } from "@/lib/recovery/fixes";

/** Floating recovery assistant for cook mode. */
export function FixMyMistake({ slug, defaultVolumeMl }: { slug: string; defaultVolumeMl: number }) {
  const [open, setOpen] = useState(false);
  const [mistake, setMistake] = useState<MistakeId>("too-salty");
  const [volume, setVolume] = useState(defaultVolumeMl);
  const [severity, setSeverity] = useState<1 | 2 | 3>(2);
  const [fix, setFix] = useState<(Fix & { tip?: string }) | null>(null);
  const [pending, startTransition] = useTransition();

  function solve() {
    setFix(fixMistake(mistake, { volumeMl: volume, severity }));
    startTransition(async () => setFix(await fixMistakeAction(slug, mistake, volume, severity)));
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="fix-panel"
        className="fixed bottom-4 right-4 z-40 min-h-16 rounded-full bg-accent px-6 text-lg font-bold text-accent-ink shadow-xl"
      >
        {open ? "Close" : "Fix my mistake"}
      </button>
      {open && (
        <section id="fix-panel" aria-label="Fix my mistake" className="fixed inset-x-4 bottom-24 z-40 max-h-[70vh] overflow-y-auto rounded-3xl border border-line bg-surface p-5 shadow-2xl sm:left-auto sm:w-96">
          <fieldset>
            <legend className="font-bold">What went wrong?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MISTAKES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMistake(m.id)}
                  aria-pressed={mistake === m.id}
                  className={`min-h-16 rounded-2xl border px-3 text-left text-sm font-medium ${mistake === m.id ? "border-accent bg-accent text-accent-ink" : "border-line"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 block text-sm font-semibold">
            How much is in the pan? {volume} ml
            <input type="range" min={100} max={3000} step={50} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mt-1 h-11 w-full" />
          </label>
          <label className="mt-2 block text-sm font-semibold">
            How bad? {["", "a little", "noticeably", "a lot"][severity]}
            <input type="range" min={1} max={3} step={1} value={severity} onChange={(e) => setSeverity(Number(e.target.value) as 1 | 2 | 3)} className="mt-1 h-11 w-full" />
          </label>
          <button onClick={solve} className="mt-3 min-h-16 w-full rounded-full bg-ink font-bold text-bg">Show me the fix</button>
          {fix && (
            <div className="mt-4" aria-live="polite">
              <h3 className="text-lg font-bold">{fix.headline}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {fix.amounts.map((a) => (
                  <li key={a.what} className="rounded-full bg-bg px-3 py-1 text-sm"><strong>{a.amount}</strong> {a.what}</li>
                ))}
              </ul>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5">{fix.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              {fix.tip && <p className="mt-3 rounded-2xl bg-bg p-3 text-sm"><strong>For this dish:</strong> {fix.tip}</p>}
              {pending && <p className="mt-2 text-xs text-muted">Checking for a dish-specific tip…</p>}
            </div>
          )}
        </section>
      )}
    </>
  );
}
