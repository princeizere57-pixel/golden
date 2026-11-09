"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Days, hours, minutes and seconds until the founding price ends. */
export function Countdown({ endsAt }: { endsAt: string }) {
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

  return (
    <div role="timer" aria-label="Time left at the founding price" className="flex justify-center gap-2">
      {parts.map((v, i) => (
        <div key={i} className="min-w-[4.2rem] rounded-2xl bg-bg px-2 py-3 text-center">
          <span className="block font-display text-[1.9rem] tabular-nums leading-none">{v}</span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-muted">{["Days", "Hours", "Mins", "Secs"][i]}</span>
        </div>
      ))}
    </div>
  );
}
