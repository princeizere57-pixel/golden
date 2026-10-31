"use client";

import { MiniYouFigure } from "@/components/mini-you";
import { useStore } from "@/components/recipe-actions";
import { DEFAULT_AVATAR, chooseFigure, readProgress, type Avatar } from "@/lib/progress-store";

/** Two cards, girl and boy Mini You; picking one saves it. */
export function FigurePicker({ onPicked, compact = false }: { onPicked?: (figure: Avatar["figure"]) => void; compact?: boolean }) {
  const p = useStore(readProgress, null);
  const current = p?.avatar ?? DEFAULT_AVATAR;
  const options: Array<{ figure: Avatar["figure"]; label: string }> = [
    { figure: "girl", label: "Girl" },
    { figure: "boy", label: "Boy" },
  ];

  return (
    <fieldset>
      <legend className="sr-only">Choose your Mini You</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ figure, label }) => {
          const on = current.figure === figure;
          const preview: Avatar = figure === "girl" ? { ...current, figure, hair: current.figure === "girl" ? current.hair : "#4a2c1d", beard: false } : { ...current, figure };
          return (
            <button
              key={figure}
              type="button"
              onClick={() => {
                chooseFigure(figure);
                onPicked?.(figure);
              }}
              aria-pressed={on}
              className={`flex flex-col items-center rounded-3xl border-2 pb-3 pt-4 transition-colors ${on ? "border-accent bg-accent-soft" : "border-line hover:border-muted/40"}`}
            >
              <MiniYouFigure avatar={preview} mood="happy" size={compact ? 96 : 120} />
              <span className="mt-1 font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
