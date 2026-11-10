"use client";

// The top of Discover: one clear next step, every day. A small habit loop: a cue (greeting and
// streak), one action (tonight's pick), and the reward you're working towards (the next rank).

import Link from "next/link";
import { FlameIcon, TrophyIcon } from "@/components/icons-3d";
import { useStore } from "@/components/recipe-actions";
import { dayKey, liveStreak, rankFor } from "@/lib/gamify";
import { readProgress } from "@/lib/progress-store";

export interface TodayPick {
  title: string;
  minutes: string;
  cookHref: string;
  planHref: string;
  image?: string;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function TodayCard({ name, pick }: { name: string; pick?: TodayPick }) {
  const p = useStore(readProgress, null);
  const now = new Date();
  const today = dayKey(now);
  const streak = p ? liveStreak(p.lastCookDay, p.streak, today) : 0;
  const cookedToday = p?.lastCookDay === today;
  const rank = rankFor(p?.xp ?? 0);

  return (
    <section aria-labelledby="today" className="mx-4 mt-3 overflow-hidden rounded-3xl bg-charcoal text-white">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="min-w-0 flex-1">
          <h2 id="today" className="text-xl font-semibold leading-tight">{greeting(now.getHours())}, {name}</h2>
          <p className="mt-0.5 text-sm text-white/70">
            {cookedToday ? "You cooked today. Streak safe until tomorrow night." : streak > 0 ? `Cook today to keep your ${streak}-day streak.` : "Cook one dish today to start a streak."}
          </p>
        </div>
        <Link href="/you" aria-label={`${streak}-day streak, ${p?.xp ?? 0} XP`} className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3 font-bold">
          <FlameIcon size={26} />
          {streak}
        </Link>
      </div>

      {pick && !cookedToday && (
        <div className="mt-4 flex items-center gap-3 px-5">
          {pick.image && (
            // eslint-disable-next-line @next/next/no-img-element -- recipe photo
            <img src={pick.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#facc15]">Tonight&apos;s pick</p>
            <p className="truncate text-lg font-semibold">{pick.title}</p>
            <p className="text-sm text-white/70">{pick.minutes}, step by step</p>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 pt-4">
        {pick && !cookedToday ? (
          <div className="flex gap-2">
            <Link href={pick.cookHref} className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-button font-semibold text-button-ink">Start cooking</Link>
            <Link href={pick.planHref} className="flex min-h-12 items-center justify-center rounded-full border border-white/25 px-4 font-semibold">Plan it</Link>
          </div>
        ) : (
          <Link href="/for-you" className="flex min-h-12 items-center justify-center rounded-full bg-button font-semibold text-button-ink">See your skill path</Link>
        )}
        <Link href="/you" className="mt-4 flex items-center gap-3 text-sm">
          <TrophyIcon size={26} />
          <span className="min-w-0 flex-1">
            <span className="flex justify-between gap-2"><span className="font-semibold">{rank.title}</span><span className="text-white/60">{rank.next ? `${rank.toNext} XP to ${rank.next}` : "Top rank"}</span></span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Progress to the next rank" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rank.progress * 100)}>
              <span className="block h-full rounded-full bg-[#facc15]" style={{ width: `${Math.max(4, rank.progress * 100)}%` }} />
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
