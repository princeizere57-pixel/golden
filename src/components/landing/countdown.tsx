"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Days, hours, minutes and seconds until the founding price ends. */
export function Countdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const end = Date.parse(endsAt);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = now === null ? null : Math.max(0, end - now);
  const parts = left === null
    ? ["--", "--", "--", "--"]
    : [Math.floor(left / 86_400_000), Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60].map(pad);

  if (compact) {
    return (
      <span role="timer" aria-label="Time left at the founding price" className="font-bold tabular-nums">
        {parts[0]}d {parts[1]}h {parts[2]}m {parts[3]}s
      </span>
    );
  }

  return (
    <div role="timer" aria-label="Time left at the founding price" className="flex justify-center gap-2 sm:gap-3">
      {parts.map((v, i) => (
        <div key={i} className="min-w-[4.2rem] rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center sm:min-w-[5rem]">
          <span className="block text-3xl font-bold tabular-nums text-white sm:text-4xl">{v}</span>
          <span className="text-[11px] uppercase tracking-widest text-white/50">{["Days", "Hours", "Mins", "Secs"][i]}</span>
        </div>
      ))}
    </div>
  );
}
