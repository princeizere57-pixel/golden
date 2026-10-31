"use client";

// Mini You: an original cartoon chef built from the user's avatar settings. White chef's hat
// and jacket, and a face that shows the current mood.

import { useEffect, useId, useState } from "react";
import { useStore } from "@/components/recipe-actions";
import { currentMood, type Mood } from "@/lib/gamify";
import { DEFAULT_AVATAR, readProgress, type Avatar } from "@/lib/progress-store";

const darken = (hex: string, by = 0.18) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.round(v * (1 - by))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

function Face({ mood }: { mood: Mood }) {
  const ink = "#2b1d16";
  switch (mood) {
    case "happy":
      return (
        <g>
          <path d="M48 72q4-5 8 0M64 72q4-5 8 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M50 80q10 12 20 0z" fill="#7a2e1f" />
          <path d="M55 84q5 3 10 0" fill="#ff8787" />
          <circle cx="45" cy="80" r="3.5" fill="#ff8fa3" opacity="0.6" />
          <circle cx="75" cy="80" r="3.5" fill="#ff8fa3" opacity="0.6" />
        </g>
      );
    case "proud":
      return (
        <g>
          <path d="M47 72q5-4 9 0M64 72q5-4 9 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M51 80q9 10 18 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M88 52l2 4 4 1-4 2-1 4-2-4-4-1 4-2zM30 58l1.4 2.8 2.8.7-2.8 1.4-.7 2.8-1.4-2.8-2.8-.7 2.8-1.4z" fill="#fcc419" />
        </g>
      );
    case "sad":
      return (
        <g>
          <path d="M45 70l9-3.5M75 70l-9-3.5" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="52" cy="74" r="2.6" fill={ink} />
          <circle cx="68" cy="74" r="2.6" fill={ink} />
          <path d="M52 86q8-7 16 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M71 78q2 4 0 6a2 2 0 0 1-3-2q1-2 3-4z" fill="#74c0fc" className="mini-tear" />
        </g>
      );
    case "focused":
      return (
        <g>
          <path d="M46 67.5l8 .8M74 67.5l-8 .8" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="52" cy="75" r="2.4" fill={ink} />
          <circle cx="68" cy="75" r="2.4" fill={ink} />
          <path d="M54 84h10" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M64 84q3 0 3 3" stroke="#ff8787" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="52" cy="74" r="2.6" fill={ink} />
          <circle cx="68" cy="74" r="2.6" fill={ink} />
          <path d="M53 82q7 6 14 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

export function MiniYouFigure({ avatar = DEFAULT_AVATAR, mood = "neutral", size = 120, className = "", headOnly = false }: { avatar?: Avatar; mood?: Mood; size?: number; className?: string; headOnly?: boolean }) {
  const { skin, hair, hairStyle, beard, glasses, photo, photoFace, cartoon, useCartoon } = avatar;
  const usePhoto = Boolean(photo) && photoFace !== false;
  const uid = useId().replace(/:/g, "");
  if (cartoon && useCartoon !== false && !headOnly) return <CartoonFigure image={cartoon} mood={mood} size={size} className={className} />;
  const anim = mood === "happy" || mood === "proud" ? "mini-bounce" : mood === "sad" ? "mini-droop" : "";
  return (
    <svg viewBox={headOnly ? "22 14 76 86" : "0 0 120 150"} width={size} height={headOnly ? size : size * 1.25} className={`${anim} ${className}`} role="img" aria-label={`Mini You, feeling ${mood}`}>
      <defs>
        <radialGradient id={`skin${uid}`} cx="0.38" cy="0.32" r="0.8"><stop offset="0" stopColor={skin} stopOpacity="0.75" /><stop offset="0.35" stopColor={skin} /><stop offset="1" stopColor={darken(skin)} /></radialGradient>
        <linearGradient id={`white${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe3e8" /></linearGradient>
      </defs>
      {!headOnly && (
        <g>
          <ellipse cx="60" cy="146" rx="34" ry="3" fill="#000" opacity="0.1" />
          {/* Chef's jacket: double-breasted with two rows of buttons and an orange neckerchief. */}
          <path d="M26 146c0-22 10-36 34-36s34 14 34 36z" fill={`url(#white${uid})`} stroke="#ced4da" />
          <path d="M60 112l-12 34M60 112l12 34" stroke="#ced4da" />
          {[122, 131, 140].map((y) => (
            <g key={y}><circle cx="52" cy={y} r="1.8" fill="#adb5bd" /><circle cx="68" cy={y} r="1.8" fill="#adb5bd" /></g>
          ))}
          <path d="M48 108l12 9 12-9-3 8-9 4-9-4z" fill="#f28c38" />
          <rect x="54" y="98" width="12" height="12" rx="4" fill={darken(skin, 0.08)} />
        </g>
      )}
      {!usePhoto && hairStyle === "long" && <path d="M33 70c-2 16 0 30 6 36h42c6-6 8-20 6-36z" fill={hair} />}
      <circle cx="35" cy="76" r="5" fill={darken(skin, 0.1)} />
      <circle cx="85" cy="76" r="5" fill={darken(skin, 0.1)} />
      {usePhoto ? (
        <PhotoFace uid={uid} photo={photo!} mood={mood} />
      ) : (
        <>
      <circle cx="60" cy="74" r="26" fill={`url(#skin${uid})`} />
      {hairStyle === "short" && <path d="M35 66c1-8 6-12 10-13l-3 12zM85 66c-1-8-6-12-10-13l3 12z" fill={hair} />}
      {hairStyle === "curly" && (
        <g fill={hair}>
          {[[36, 62], [34, 70], [84, 62], [86, 70], [38, 55], [82, 55]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />)}
        </g>
      )}
      {hairStyle === "long" && <path d="M36 64c2-9 8-13 12-14l-6 18zM84 64c-2-9-8-13-12-14l6 18z" fill={hair} />}
      {beard && <path d="M37 80c2 14 12 21 23 21s21-7 23-21c-4 6-10 8-14 8-3-3-6-4-9-4s-6 1-9 4c-4 0-10-2-14-8z" fill={hair} />}
      <Face mood={mood} />
      {glasses && (
        <g fill="none" stroke="#212529" strokeWidth="2">
          <circle cx="52" cy="74" r="6.5" /><circle cx="68" cy="74" r="6.5" /><path d="M58.5 74h3M45.5 73l-9-2M74.5 73l9-2" />
        </g>
      )}
        </>
      )}
      {/* Chef's hat. */}
      <g>
        <circle cx="44" cy="38" r="11" fill={`url(#white${uid})`} />
        <circle cx="76" cy="38" r="11" fill={`url(#white${uid})`} />
        <circle cx="60" cy="31" r="14" fill={`url(#white${uid})`} />
        <rect x="40" y="38" width="40" height="14" fill={`url(#white${uid})`} />
        <rect x="38" y="48" width="44" height="8" rx="3" fill="#e9ecef" stroke="#ced4da" />
        <path d="M52 26a9 9 0 0 1 9-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

const MOOD_EMOJI: Record<Mood, string> = { neutral: "🙂", happy: "😄", proud: "🤩", sad: "😢", focused: "🧐" };

/** The user's own photo as Mini You's face, with a mood badge so emotions still show. */
function PhotoFace({ uid, photo, mood }: { uid: string; photo: string; mood: Mood }) {
  return (
    <g>
      <defs>
        <clipPath id={`face${uid}`}><circle cx="60" cy="74" r="26" /></clipPath>
      </defs>
      <image href={photo} x="34" y="48" width="52" height="52" preserveAspectRatio="xMidYMid slice" clipPath={`url(#face${uid})`} />
      <circle cx="60" cy="74" r="26" fill="none" stroke="#fff" strokeWidth="2.5" />
      {(mood === "happy" || mood === "proud") && (
        <path d="M90 50l2 4 4 1-4 2-1 4-2-4-4-1 4-2zM28 62l1.4 2.8 2.8.7-2.8 1.4-.7 2.8-1.4-2.8-2.8-.7 2.8-1.4z" fill="#fcc419" />
      )}
      {mood === "sad" && <path d="M41 80q2.5 5 0 7.5a2.5 2.5 0 0 1-3.6-2.5q1-2.5 3.6-5z" fill="#74c0fc" className="mini-tear" />}
      <circle cx="84" cy="94" r="10" fill="#fff" stroke="#e9ecef" />
      <text x="84" y="98.5" textAnchor="middle" fontSize="13">{MOOD_EMOJI[mood]}</text>
    </g>
  );
}

/** The 3D cartoon version of you, with the same mood badge and animations as the drawn chef. */
function CartoonFigure({ image, mood, size, className }: { image: string; mood: Mood; size: number; className: string }) {
  const anim = mood === "happy" || mood === "proud" ? "mini-bounce" : mood === "sad" ? "mini-droop" : "";
  return (
    <span className={`relative inline-block ${anim} ${className}`} style={{ width: size, height: size * 1.25 }} role="img" aria-label={`Mini You, feeling ${mood}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated avatar stored on the device */}
      <img src={image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
      <span className="absolute bottom-[8%] right-[6%] flex h-[22%] w-[22%] items-center justify-center rounded-full border border-line bg-white shadow" style={{ fontSize: size * 0.13 }} aria-hidden>
        {MOOD_EMOJI[mood]}
      </span>
      {mood === "sad" && <span aria-hidden className="mini-tear absolute left-[38%] top-[26%] h-[5%] w-[3%] rounded-full bg-[#74c0fc]" />}
      {(mood === "happy" || mood === "proud") && <span aria-hidden className="absolute right-[12%] top-[6%]" style={{ fontSize: size * 0.12 }}>✨</span>}
    </span>
  );
}

/** Mini You wired to the saved avatar and current mood. */
export function MiniYou(props: { size?: number; className?: string; headOnly?: boolean; mood?: Mood }) {
  const progress = useStore(readProgress, null);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), [progress]);
  const mood = props.mood ?? currentMood(progress?.mood, now);
  return <MiniYouFigure {...props} avatar={progress?.avatar ?? DEFAULT_AVATAR} mood={mood} />;
}
