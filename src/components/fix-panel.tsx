"use client";

// Fix My Mistake, inline on the plan page: snap or upload a photo of the dish (optional), pick
// what went wrong, and get the exact fix from Golden's recovery database.

import { useRef, useState, useTransition } from "react";
import { diagnoseDish } from "@/app/actions/diagnose";
import { LifebuoyIcon } from "@/components/icons-3d";
import { MiniYou } from "@/components/mini-you";
import { track } from "@/lib/analytics";
import { XP } from "@/lib/gamify";
import { recordFixed, recordMistake } from "@/lib/progress-store";
import { MISTAKES, fixMistake, type Fix, type MistakeId } from "@/lib/recovery/fixes";

/** Shrinks a photo to a 512 px JPEG in the browser before anything else happens. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That image couldn't be opened."));
      i.src = url;
    });
    const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FixPanel({ dish, defaultVolumeMl, aiReady }: { dish: string; defaultVolumeMl: number; aiReady: boolean }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [mistake, setMistake] = useState<MistakeId | null>(null);
  const [volume, setVolume] = useState(defaultVolumeMl);
  const [severity, setSeverity] = useState<1 | 2 | 3>(2);
  const [fix, setFix] = useState<Fix | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [rescued, setRescued] = useState(false);
  const [pending, startTransition] = useTransition();
  const file = useRef<HTMLInputElement>(null);

  function show(id: MistakeId) {
    setMistake(id);
    setRescued(false);
    setFix(fixMistake(id, { volumeMl: volume, severity }));
    recordMistake(MISTAKES.find((m) => m.id === id)!.label, dish);
  }

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    const shot = await shrink(f);
    setPhoto(shot);
    setNote(null);
    if (!aiReady) return;
    startTransition(async () => {
      const d = await diagnoseDish(shot, dish);
      if (d.ok) {
        setNote(`From your photo: ${d.note}`);
        show(d.mistake);
      } else {
        setNote(d.reason === "unclear" ? "We couldn't tell from the photo. Tap what you see below." : "Photo check isn't available right now. Tap what you see below.");
      }
    });
  }

  return (
    <section aria-labelledby="fix-title" className="rounded-3xl border border-line p-5">
      <div className="flex items-center gap-3">
        <LifebuoyIcon size={40} />
        <div>
          <h2 id="fix-title" className="text-xl font-semibold">Fix My Mistake</h2>
          <p className="text-sm text-muted">Something going wrong? Snap the dish or tap what you see, and get the exact fix.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- the user's photo, kept in memory only
          <img src={photo} alt="Your dish" className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <span aria-hidden className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface text-3xl">📷</span>
        )}
        <div className="flex-1">
          <button onClick={() => file.current?.click()} className="min-h-12 rounded-full bg-button px-5 font-semibold text-button-ink">
            {photo ? "Retake photo" : "Snap or upload the dish"}
          </button>
          <p className="mt-1 text-xs text-muted">
            {aiReady ? "We suggest what's wrong from the photo. It isn't saved." : "Optional: helps you compare. Photo check turns on with a Gemini key."}
          </p>
        </div>
        <input ref={file} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Photo of the dish" onChange={(e) => onPhoto(e.target.files?.[0])} />
      </div>
      {pending && <p className="mt-3 text-sm text-muted" aria-live="polite">Looking at your dish…</p>}
      {note && <p className="mt-3 rounded-2xl bg-surface p-3 text-sm" aria-live="polite">{note}</p>}

      <fieldset className="mt-4">
        <legend className="font-semibold">What went wrong?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {MISTAKES.map((m) => (
            <button key={m.id} onClick={() => show(m.id)} aria-pressed={mistake === m.id} className={`min-h-14 rounded-2xl border px-3 text-left text-sm font-medium ${mistake === m.id ? "border-accent bg-accent-soft" : "border-line"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-semibold">
        How much is in the pan? {volume} ml
        <input type="range" min={100} max={3000} step={50} value={volume} onChange={(e) => { setVolume(Number(e.target.value)); if (mistake) setFix(fixMistake(mistake, { volumeMl: Number(e.target.value), severity })); }} className="mt-1 h-11 w-full" />
      </label>
      <label className="mt-1 block text-sm font-semibold">
        How bad? {["", "a little", "noticeably", "a lot"][severity]}
        <input type="range" min={1} max={3} step={1} value={severity} onChange={(e) => { const s = Number(e.target.value) as 1 | 2 | 3; setSeverity(s); if (mistake) setFix(fixMistake(mistake, { volumeMl: volume, severity: s })); }} className="mt-1 h-11 w-full" />
      </label>

      {fix && (
        <div className="mt-4" aria-live="polite">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface p-3">
            <MiniYou headOnly size={52} mood={rescued ? "happy" : "sad"} />
            <p className="text-sm">{rescued ? `Saved it! +${XP.fixed} XP.` : "Happens to every chef. Here's how we fix it:"}</p>
          </div>
          <h3 className="text-lg font-bold">{fix.headline}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {fix.amounts.map((a) => <li key={a.what} className="rounded-full bg-accent-soft px-3 py-1 text-sm"><strong>{a.amount}</strong> {a.what}</li>)}
          </ul>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">{fix.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          {!rescued && (
            <button
              onClick={() => {
                recordFixed(fix.headline);
                track("mistake_fixed", { mistake: fix.mistake });
                setRescued(true);
              }}
              className="mt-4 min-h-14 w-full rounded-full border-2 border-button font-bold"
            >
              It worked!
            </button>
          )}
        </div>
      )}
    </section>
  );
}
