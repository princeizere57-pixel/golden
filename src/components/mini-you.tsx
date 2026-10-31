"use client";

// Mini You: an original cartoon chef, a boy or a girl, built from the user's avatar settings.
// White chef's hat and jacket, and a face that shows the current mood.

import { useEffect, useId, useState } from "react";
import { useStore } from "@/components/recipe-actions";
import { currentMood, type Mood } from "@/lib/gamify";
import { DEFAULT_AVATAR, readProgress, type Avatar } from "@/lib/progress-store";

const darken = (hex: string, by = 0.18) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.round(v * (1 - by))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

const INK = "#2b1d16";
const SPARKLES = "M88 52l2 4 4 1-4 2-1 4-2-4-4-1 4-2zM30 58l1.4 2.8 2.8.7-2.8 1.4-.7 2.8-1.4-2.8-2.8-.7 2.8-1.4z";

/** Open eyes with a small highlight; the girl gets lashes. */
function Eyes({ y = 74, r = 2.6, girl }: { y?: number; r?: number; girl: boolean }) {
  return (
    <g>
      <circle cx="52" cy={y} r={girl ? r + 0.4 : r} fill={INK} />
      <circle cx="68" cy={y} r={girl ? r + 0.4 : r} fill={INK} />
      {girl && (
        <>
          <circle cx="53" cy={y - 1} r="0.9" fill="#fff" />
          <circle cx="69" cy={y - 1} r="0.9" fill="#fff" />
          <path d={`M48.6 ${y - 1.6}l-2.4-1.6M49.6 ${y - 2.8}l-1.6-2.2M71.4 ${y - 1.6}l2.4-1.6M70.4 ${y - 2.8}l1.6-2.2`} stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** Smiling closed eyes (happy, proud); the girl's have a flick of lashes at the corners. */
function SmileEyes({ girl }: { girl: boolean }) {
  return (
    <g stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round">
      <path d="M48 72q4-5 8 0M64 72q4-5 8 0" />
      {girl && <path d="M47.6 71.6l-2.2-1.2M72.4 71.6l2.2-1.2" strokeWidth="1.4" />}
    </g>
  );
}

const Blush = ({ girl }: { girl: boolean }) => (
  <g fill={girl ? "#ff8fab" : "#ff8fa3"} opacity={girl ? 0.7 : 0.6}>
    <ellipse cx="44.5" cy="80" rx={girl ? 4.5 : 3.5} ry={girl ? 3 : 3.5} />
    <ellipse cx="75.5" cy="80" rx={girl ? 4.5 : 3.5} ry={girl ? 3 : 3.5} />
  </g>
);

/** The girl's big smile: rosy lips around a bright row of teeth. */
const GirlGrin = () => (
  <g>
    <path d="M48.5 79q11.5 13.5 23 0q-11.5 3.4-23 0z" fill="#e64980" />
    <path d="M50.6 80.2q9.4 2.6 18.8 0q-.6 2.6-2.2 3.6q-7.2 2-14.4 0q-1.6-1-2.2-3.6z" fill="#fff" />
    <path d="M55 87.6q5 2.2 10 0" stroke="#c2255c" strokeWidth="1" fill="none" strokeLinecap="round" />
  </g>
);

function Face({ mood, girl }: { mood: Mood; girl: boolean }) {
  switch (mood) {
    case "happy":
      return (
        <g>
          <SmileEyes girl={girl} />
          {girl ? (
            <GirlGrin />
          ) : (
            <>
              <path d="M50 80q10 12 20 0z" fill="#7a2e1f" />
              <path d="M55 84q5 3 10 0" fill="#ff8787" />
            </>
          )}
          <Blush girl={girl} />
        </g>
      );
    case "proud":
      return (
        <g>
          <SmileEyes girl={girl} />
          {girl ? <GirlGrin /> : <path d="M51 80q9 10 18 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
          {girl && <Blush girl />}
          <path d={SPARKLES} fill="#fcc419" />
        </g>
      );
    case "sad":
      return (
        <g>
          <path d="M45 70l9-3.5M75 70l-9-3.5" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <Eyes girl={girl} />
          <path d="M52 86q8-7 16 0" stroke={girl ? "#c2255c" : INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M71 78q2 4 0 6a2 2 0 0 1-3-2q1-2 3-4z" fill="#74c0fc" className="mini-tear" />
        </g>
      );
    case "focused":
      return (
        <g>
          <path d="M46 67.5l8 .8M74 67.5l-8 .8" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <Eyes y={75} r={2.4} girl={girl} />
          <path d="M54 84h10" stroke={girl ? "#c2255c" : INK} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M64 84q3 0 3 3" stroke="#ff8787" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <Eyes girl={girl} />
          {girl ? (
            <>
              <path d="M51.5 81.5q8.5 8 17 0q-8.5 3-17 0z" fill="#e64980" />
              <Blush girl />
            </>
          ) : (
            <path d="M53 82q7 6 14 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          )}
        </g>
      );
  }
}

/** Voluminous curls: a full mass behind the head down past the shoulders. */
const GIRL_BACK_CURLS = [
  [34, 58, 9], [86, 58, 9], [29, 70, 9], [91, 70, 9], [28, 83, 9], [92, 83, 9],
  [30, 96, 8.5], [90, 96, 8.5], [35, 106, 8], [85, 106, 8], [44, 104, 7], [76, 104, 7],
] as const;
/** Curls framing the face under the hat. */
const GIRL_FRONT_CURLS = [[38.5, 60, 6.5], [81.5, 60, 6.5], [34.5, 69, 5.5], [85.5, 69, 5.5], [47, 56.5, 5], [73, 56.5, 5]] as const;

export function MiniYouFigure({ avatar = DEFAULT_AVATAR, mood = "neutral", size = 120, className = "", headOnly = false }: { avatar?: Avatar; mood?: Mood; size?: number; className?: string; headOnly?: boolean }) {
  const { skin, hair, hairStyle, beard, glasses } = avatar;
  const girl = avatar.figure === "girl";
  const uid = useId().replace(/:/g, "");
  const anim = mood === "happy" || mood === "proud" ? "mini-bounce" : mood === "sad" ? "mini-droop" : "";
  return (
    <svg viewBox={headOnly ? "20 14 80 86" : "0 0 120 150"} width={size} height={headOnly ? size : size * 1.25} className={`${anim} ${className}`} role="img" aria-label={`Mini You (${girl ? "girl" : "boy"}), feeling ${mood}`}>
      <defs>
        <radialGradient id={`skin${uid}`} cx="0.38" cy="0.32" r="0.8"><stop offset="0" stopColor={skin} stopOpacity="0.75" /><stop offset="0.35" stopColor={skin} /><stop offset="1" stopColor={darken(skin)} /></radialGradient>
        <linearGradient id={`white${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe3e8" /></linearGradient>
        <radialGradient id={`hair${uid}`} cx="0.4" cy="0.3" r="0.9"><stop offset="0" stopColor={hair} stopOpacity="0.8" /><stop offset="0.5" stopColor={hair} /><stop offset="1" stopColor={darken(hair, 0.25)} /></radialGradient>
      </defs>

      {girl && (
        <g fill={`url(#hair${uid})`}>
          <path d="M30 60c-4 20-4 40 6 52h48c10-12 10-32 6-52z" />
          {GIRL_BACK_CURLS.map(([x, y, r]) => <circle key={`b${x}-${y}`} cx={x} cy={y} r={r} />)}
        </g>
      )}

      {!headOnly && (
        <g>
          <ellipse cx="60" cy="146" rx="34" ry="3" fill="#000" opacity="0.1" />
          {/* Chef's jacket: double-breasted with two rows of buttons and a neckerchief. */}
          <path d="M26 146c0-22 10-36 34-36s34 14 34 36z" fill={`url(#white${uid})`} stroke="#ced4da" />
          <path d="M60 112l-12 34M60 112l12 34" stroke="#ced4da" />
          {[122, 131, 140].map((y) => (
            <g key={y}><circle cx="52" cy={y} r="1.8" fill="#adb5bd" /><circle cx="68" cy={y} r="1.8" fill="#adb5bd" /></g>
          ))}
          <path d="M48 108l12 9 12-9-3 8-9 4-9-4z" fill={girl ? "#e64980" : "#f28c38"} />
          <rect x="54" y="98" width="12" height="12" rx="4" fill={darken(skin, 0.08)} />
          {girl && (
            // A few curls resting on the shoulders, in front of the jacket.
            <g fill={`url(#hair${uid})`}>
              <circle cx="33" cy="112" r="7" /><circle cx="87" cy="112" r="7" /><circle cx="36" cy="120" r="5.5" /><circle cx="84" cy="120" r="5.5" />
            </g>
          )}
        </g>
      )}

      {!girl && hairStyle === "long" && <path d="M33 70c-2 16 0 30 6 36h42c6-6 8-20 6-36z" fill={hair} />}
      <circle cx="35" cy="76" r="5" fill={darken(skin, 0.1)} />
      <circle cx="85" cy="76" r="5" fill={darken(skin, 0.1)} />
      <circle cx="60" cy="74" r="26" fill={`url(#skin${uid})`} />

      {girl ? (
        <g fill={`url(#hair${uid})`}>{GIRL_FRONT_CURLS.map(([x, y, r]) => <circle key={`f${x}-${y}`} cx={x} cy={y} r={r} />)}</g>
      ) : (
        <>
          {hairStyle === "short" && <path d="M35 66c1-8 6-12 10-13l-3 12zM85 66c-1-8-6-12-10-13l3 12z" fill={hair} />}
          {hairStyle === "curly" && (
            <g fill={hair}>
              {[[36, 62], [34, 70], [84, 62], [86, 70], [38, 55], [82, 55]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />)}
            </g>
          )}
          {hairStyle === "long" && <path d="M36 64c2-9 8-13 12-14l-6 18zM84 64c-2-9-8-13-12-14l6 18z" fill={hair} />}
          {beard && <path d="M37 80c2 14 12 21 23 21s21-7 23-21c-4 6-10 8-14 8-3-3-6-4-9-4s-6 1-9 4c-4 0-10-2-14-8z" fill={hair} />}
        </>
      )}

      <Face mood={mood} girl={girl} />
      {glasses && (
        <g fill="none" stroke="#212529" strokeWidth="2">
          <circle cx="52" cy="74" r="6.5" /><circle cx="68" cy="74" r="6.5" /><path d="M58.5 74h3M45.5 73l-9-2M74.5 73l9-2" />
        </g>
      )}
      {girl && (
        <g fill="#fcc419" stroke="#e8a100" strokeWidth="0.6">
          <circle cx="34.5" cy="84" r="2.2" /><circle cx="85.5" cy="84" r="2.2" />
        </g>
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

/** Mini You wired to the saved avatar and current mood. */
export function MiniYou(props: { size?: number; className?: string; headOnly?: boolean; mood?: Mood }) {
  const progress = useStore(readProgress, null);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), [progress]);
  const mood = props.mood ?? currentMood(progress?.mood, now);
  return <MiniYouFigure {...props} avatar={progress?.avatar ?? DEFAULT_AVATAR} mood={mood} />;
}
