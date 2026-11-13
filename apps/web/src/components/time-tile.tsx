// Stand-in for a recipe photo: Golden's 3D stopwatch with the cooking time beside it.

import { StopwatchIcon } from "@/components/icons-3d";

export function TimeTile({ time, compact = false }: { time: string; compact?: boolean }) {
  if (compact) {
    return (
      <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <StopwatchIcon size={44} />
      </span>
    );
  }
  return (
    <span className="flex aspect-square w-full items-center justify-center gap-2 bg-accent-soft px-3">
      <StopwatchIcon size={64} className="shrink-0" />
      <span className="whitespace-nowrap font-display text-xl leading-none text-ink">{time}</span>
    </span>
  );
}
