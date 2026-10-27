"use client";

// Parallel countdown timers that survive navigation and reloads. Each timer stores its end
// time, so the countdown stays correct even if the tab was asleep.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Timer {
  id: string;
  label: string;
  recipeSlug: string;
  endsAt: number;
}

interface TimerApi {
  timers: Timer[];
  now: number;
  start: (timer: Omit<Timer, "endsAt">, minutes: number) => void;
  cancel: (id: string) => void;
}

const STORAGE_KEY = "bac-timers";
const TimerContext = createContext<TimerApi | null>(null);

export function useTimers(): TimerApi {
  const api = useContext(TimerContext);
  if (!api) throw new Error("useTimers must be used inside <TimerProvider>");
  return api;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function chime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // Audio may be blocked until the user interacts; the visual alert still shows.
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Timer[];
      if (Array.isArray(saved)) setTimers(saved);
    } catch {
      // Storage unavailable: timers just won't persist.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
    } catch {}
  }, [timers]);

  useEffect(() => {
    if (!timers.length) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timers.length]);

  // Ring once for each timer as it crosses zero.
  const [rung, setRung] = useState<string[]>([]);
  useEffect(() => {
    const done = timers.filter((t) => t.endsAt <= now && !rung.includes(t.id));
    if (done.length) {
      chime();
      setRung((r) => [...r, ...done.map((t) => t.id)]);
    }
  }, [now, timers, rung]);

  const start = useCallback((timer: Omit<Timer, "endsAt">, minutes: number) => {
    setNow(Date.now());
    setRung((r) => r.filter((id) => id !== timer.id));
    setTimers((ts) => [...ts.filter((t) => t.id !== timer.id), { ...timer, endsAt: Date.now() + minutes * 60_000 }]);
  }, []);

  const cancel = useCallback((id: string) => setTimers((ts) => ts.filter((t) => t.id !== id)), []);

  const api = useMemo(() => ({ timers, now, start, cancel }), [timers, now, start, cancel]);
  return <TimerContext.Provider value={api}>{children}</TimerContext.Provider>;
}

/** Floating list of running timers, visible on every page. */
export function TimerTray() {
  const { timers, now, cancel } = useTimers();
  if (!timers.length) return null;
  return (
    <aside aria-label="Running timers" className="fixed bottom-24 left-4 z-40 lg:bottom-4 flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      {timers.map((t) => {
        const left = t.endsAt - now;
        return (
          <div
            key={t.id}
            role={left <= 0 ? "alert" : undefined}
            className={`flex items-center gap-3 rounded-2xl border border-line px-4 py-2 shadow-lg ${left <= 0 ? "bg-accent text-accent-ink" : "bg-surface"}`}
          >
            <span className="text-sm font-medium">{t.label}</span>
            <span className="font-mono text-lg tabular-nums" aria-live="off">{left <= 0 ? "Done" : formatClock(left)}</span>
            <button onClick={() => cancel(t.id)} className="min-h-11 min-w-11 rounded-full text-sm underline" aria-label={`Dismiss ${t.label} timer`}>
              ✕
            </button>
          </div>
        );
      })}
    </aside>
  );
}
