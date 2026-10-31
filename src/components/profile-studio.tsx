"use client";

// Mini You studio: upload a photo (we read skin and hair colour from it), fine-tune the look,
// and see XP, rank and streak.

import { useState } from "react";
import { FlameIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { MiniYou } from "@/components/mini-you";
import { PhotoCapture } from "@/components/photo-capture";
import { useStore } from "@/components/recipe-actions";
import { dayKey, liveStreak, rankFor, type Mood } from "@/lib/gamify";
import { readProgress, updateAvatar, type Avatar } from "@/lib/progress-store";

const SKINS = ["#f6d7c3", "#eac0a0", "#e0ac83", "#c68a5e", "#9c6644", "#6f4630", "#4a2e20"];
const HAIRS = ["#1b1310", "#3b2a20", "#6b4226", "#a8693b", "#d9a95b", "#e9e1d4", "#c0392b"];
const STYLES: Avatar["hairStyle"][] = ["short", "curly", "long", "none"];
const MOODS: Mood[] = ["neutral", "happy", "proud", "focused", "sad"];

export function ProfileStudio() {
  const p = useStore(readProgress, null);
  const [preview, setPreview] = useState<Mood | undefined>();
  const [capturing, setCapturing] = useState(false);
  if (!p) return null;
  const rank = rankFor(p.xp);
  const streak = liveStreak(p.lastCookDay, p.streak, dayKey(new Date()));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section className="flex flex-col items-center rounded-3xl bg-accent-soft p-6">
        <MiniYou size={190} mood={preview} />
        <p className="mt-2 font-display text-2xl">{rank.title}</p>
        <div className="mt-3 w-full max-w-xs">
          <div className="h-3 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rank.progress * 100)} aria-label="Progress to next rank">
            <div className="h-full rounded-full bg-button transition-[width]" style={{ width: `${rank.progress * 100}%` }} />
          </div>
          <p className="mt-1 text-center text-sm text-muted">{rank.next ? `${p.xp} XP · ${rank.toNext} to ${rank.next}` : `${p.xp} XP · top rank!`}</p>
        </div>
        <dl className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
          <Stat icon={<FlameIcon size={30} />} label="Day streak" value={streak} />
          <Stat icon={<SteamingDishIcon size={30} />} label="Dishes" value={p.dishes} />
          <Stat icon={<TrophyIcon size={30} />} label="XP" value={p.xp} />
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Make Mini You look like you</h2>
        <div className="mt-4 rounded-3xl border border-line p-4">
          {capturing ? (
            <PhotoCapture compact onDone={() => { setCapturing(false); setPreview("happy"); }} onSkip={() => setCapturing(false)} />
          ) : (
            <div className="flex items-center gap-4">
              {p.avatar.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- the user's own photo (data URL)
                <img src={p.avatar.photo} alt="Your profile photo" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="h-16 w-16 rounded-full bg-surface" />
              )}
              <div className="flex-1">
                <button onClick={() => setCapturing(true)} className="min-h-12 rounded-full bg-button px-5 font-semibold text-button-ink">
                  {p.avatar.photo ? "New photo" : "Take or upload a photo"}
                </button>
                <p className="mt-1 text-xs text-muted">Camera or upload. We ask for camera access only when you choose it.</p>
              </div>
            </div>
          )}
        </div>

        {p.avatar.photo && (
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Show Mini You as</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: "3D cartoon", on: Boolean(p.avatar.cartoon) && p.avatar.useCartoon !== false, set: { useCartoon: true, photoFace: true }, show: Boolean(p.avatar.cartoon) },
                { label: "My photo", on: !(p.avatar.cartoon && p.avatar.useCartoon !== false) && p.avatar.photoFace !== false, set: { useCartoon: false, photoFace: true }, show: true },
                { label: "Drawn chef", on: p.avatar.photoFace === false && !(p.avatar.cartoon && p.avatar.useCartoon !== false), set: { useCartoon: false, photoFace: false }, show: true },
              ].filter((o) => o.show).map((o) => (
                <button key={o.label} onClick={() => updateAvatar(o.set)} aria-pressed={o.on} className={`min-h-11 rounded-full border px-4 text-sm ${o.on ? "border-button bg-button text-button-ink" : "border-line"}`}>{o.label}</button>
              ))}
            </div>
          </fieldset>
        )}

        <Swatches label="Skin" colours={SKINS} value={p.avatar.skin} onPick={(skin) => updateAvatar({ skin })} />
        <Swatches label="Hair colour" colours={HAIRS} value={p.avatar.hair} onPick={(hair) => updateAvatar({ hair })} />

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Hair</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button key={s} onClick={() => updateAvatar({ hairStyle: s })} aria-pressed={p.avatar.hairStyle === s} className={`min-h-11 rounded-full border px-4 text-sm capitalize ${p.avatar.hairStyle === s ? "border-button bg-button text-button-ink" : "border-line"}`}>
                {s === "none" ? "Under the hat" : s}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex gap-2">
          <Toggle label="Beard" on={p.avatar.beard} onClick={() => updateAvatar({ beard: !p.avatar.beard })} />
          <Toggle label="Glasses" on={p.avatar.glasses} onClick={() => updateAvatar({ glasses: !p.avatar.glasses })} />
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">See Mini You&apos;s moods</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button key={m} onClick={() => setPreview(m)} aria-pressed={preview === m} className={`min-h-11 rounded-full border px-4 text-sm capitalize ${preview === m ? "border-button bg-button text-button-ink" : "border-line"}`}>{m}</button>
            ))}
          </div>
        </fieldset>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-bg p-3">
      {icon}
      <dd className="mt-1 text-xl font-bold">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}

function Swatches({ label, colours, value, onPick }: { label: string; colours: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {colours.map((c) => (
          <button key={c} onClick={() => onPick(c)} aria-label={`${label} ${c}`} aria-pressed={value.toLowerCase() === c} className={`h-11 w-11 rounded-full border-2 ${value.toLowerCase() === c ? "border-ink ring-2 ring-button" : "border-line"}`} style={{ background: c }} />
        ))}
        {!colours.includes(value.toLowerCase()) && (
          <span className="flex h-11 items-center gap-2 rounded-full border-2 border-ink px-3 text-xs ring-2 ring-button">
            <span className="h-6 w-6 rounded-full" style={{ background: value }} /> From photo
          </span>
        )}
      </div>
    </fieldset>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`min-h-11 rounded-full border px-4 text-sm ${on ? "border-button bg-button text-button-ink" : "border-line"}`}>{label}</button>
  );
}
