"use client";

// Mini You studio: upload a photo (we read skin and hair colour from it), fine-tune the look,
// and see XP, rank and streak.

import { useRef, useState } from "react";
import { FlameIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { MiniYou } from "@/components/mini-you";
import { useStore } from "@/components/recipe-actions";
import { dayKey, liveStreak, rankFor, type Mood } from "@/lib/gamify";
import { readProgress, updateAvatar, type Avatar } from "@/lib/progress-store";

const SKINS = ["#f6d7c3", "#eac0a0", "#e0ac83", "#c68a5e", "#9c6644", "#6f4630", "#4a2e20"];
const HAIRS = ["#1b1310", "#3b2a20", "#6b4226", "#a8693b", "#d9a95b", "#e9e1d4", "#c0392b"];
const STYLES: Avatar["hairStyle"][] = ["short", "curly", "long", "none"];
const MOODS: Mood[] = ["neutral", "happy", "proud", "focused", "sad"];

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** Reads a photo: a small square copy to keep, the average face colour and the darkest top colour. */
async function readPhoto(file: File): Promise<{ photo: string; skin: string; hair: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 128, 128);
    const avg = (x0: number, y0: number, w: number, h: number, pick?: (l: number) => boolean) => {
      const { data } = ctx.getImageData(x0, y0, w, h);
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const l = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        if (pick && !pick(l)) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      return n ? toHex(r / n, g / n, b / n) : undefined;
    };
    // Face: the centre of a typical headshot. Hair: the darker pixels across the top.
    const skin = avg(46, 50, 36, 30) ?? SKINS[2];
    const hair = avg(30, 6, 68, 22, (l) => l < 110) ?? HAIRS[1];
    return { photo: canvas.toDataURL("image/jpeg", 0.8), skin, hair };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfileStudio() {
  const p = useStore(readProgress, null);
  const [preview, setPreview] = useState<Mood | undefined>();
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  if (!p) return null;
  const rank = rankFor(p.xp);
  const streak = liveStreak(p.lastCookDay, p.streak, dayKey(new Date()));

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      updateAvatar(await readPhoto(f));
      setPreview("happy");
    } finally {
      setBusy(false);
    }
  }

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
        <div className="mt-4 flex items-center gap-4">
          {p.avatar.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- the user's own photo (data URL)
            <img src={p.avatar.photo} alt="Your profile photo" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="h-16 w-16 rounded-full bg-surface" />
          )}
          <div>
            <button onClick={() => file.current?.click()} disabled={busy} className="min-h-12 rounded-full bg-button px-5 font-semibold text-button-ink disabled:opacity-60">
              {busy ? "Reading photo…" : p.avatar.photo ? "Change photo" : "Upload a photo"}
            </button>
            <p className="mt-1 text-xs text-muted">We pick up your skin and hair colour. The photo stays on this device.</p>
          </div>
          <input ref={file} type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} aria-label="Profile photo" />
        </div>

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
