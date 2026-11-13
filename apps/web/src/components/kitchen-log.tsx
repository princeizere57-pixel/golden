"use client";

// Activity feed: each thing that happened in your kitchen is a card with a 3D icon, a bold
// title and a detail, an optional photo and a green tick. Mini You comments on top.

import { MiniYou } from "@/components/mini-you";
import { useStore } from "@/components/recipe-actions";
import { FlameIcon, HatIcon, LifebuoyIcon, NotepadIcon, SackIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { MOOD_LINES, currentMood, liveStreak, dayKey } from "@/lib/gamify";
import { readProgress, type LogKind } from "@/lib/progress-store";

const ICON: Record<LogKind, (p: { size?: number }) => React.ReactElement> = {
  cooked: SteamingDishIcon,
  mistake: LifebuoyIcon,
  fixed: LifebuoyIcon,
  rank: TrophyIcon,
  saved: SackIcon,
  listed: NotepadIcon,
  quiz: HatIcon,
};

function Tick({ pending = false }: { pending?: boolean }) {
  return pending ? (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-line" aria-label="In progress" />
  ) : (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f9e6e] text-white" aria-label="Done">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
    </span>
  );
}

const ago = (at: number) => {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} d ago`;
};

export function KitchenLog({ limit = 12 }: { limit?: number }) {
  const p = useStore(readProgress, null);
  if (!p) return null;
  const mood = currentMood(p.mood, Date.now());
  const line = MOOD_LINES[mood][p.log.length % MOOD_LINES[mood].length];
  const streak = liveStreak(p.lastCookDay, p.streak, dayKey(new Date()));

  return (
    <section aria-label="Kitchen log">
      <div className="flex items-start gap-3">
        <span className="shrink-0 overflow-hidden rounded-full bg-accent-soft"><MiniYou headOnly size={44} /></span>
        <div>
          <p className="font-semibold">Mini You</p>
          <p className="text-[17px]">{line}{streak > 1 ? ` ${streak} days in a row!` : ""}</p>
        </div>
      </div>

      {p.log.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-4">
          <HatIcon />
          <p className="flex-1"><strong>Kitchen log</strong> <span className="text-muted">· cook your first dish to start it</span></p>
          <Tick pending />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {p.log.slice(0, limit).map((e) => {
            const Icon = ICON[e.kind];
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 pl-4">
                <Icon size={30} />
                <p className="min-w-0 flex-1 leading-snug">
                  <strong>{e.title}</strong> <span className="text-muted">· {e.detail}</span>
                  <span className="block text-xs text-muted">{ago(e.at)}</span>
                </p>
                {e.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- recipe photo
                  <img src={e.image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                )}
                <Tick pending={e.kind === "mistake"} />
              </li>
            );
          })}
        </ul>
      )}
      {streak > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted"><FlameIcon size={20} /> {streak}-day cooking streak</p>
      )}
    </section>
  );
}
