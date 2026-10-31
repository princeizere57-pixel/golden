"use client";

import Link from "next/link";
import { FlameIcon } from "@/components/icons-3d";
import { useStore } from "@/components/recipe-actions";
import { dayKey, liveStreak } from "@/lib/gamify";
import { readProgress } from "@/lib/progress-store";

/** Streak and XP at a glance; links to Mini You. */
export function XpChip() {
  const p = useStore(readProgress, null);
  const streak = p ? liveStreak(p.lastCookDay, p.streak, dayKey(new Date())) : 0;
  return (
    <Link href="/you" className="flex h-12 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-surface pl-2 pr-3.5 text-sm font-bold" aria-label={`${streak}-day streak, ${p?.xp ?? 0} XP`}>
      <FlameIcon size={26} />
      {streak}
      <span className="ml-1.5 font-semibold text-muted">{p?.xp ?? 0} XP</span>
    </Link>
  );
}
