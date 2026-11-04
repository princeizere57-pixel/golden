"use client";

// Save, add-to-shopping-list and share buttons, the review prompt, and the store hook.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { STORE_EVENT, addToShopping, isSaved, listPantry, listSaved, listShopping, toggleSaved } from "@/lib/device-store";
import { covers } from "@/lib/pantry";
import { formatDuration, recipeHref, totalMinutes } from "@/lib/links";
import { recordActivity } from "@/lib/progress-store";
import type { Recipe } from "@/lib/types";

const thumbOf = (image?: string) => (image?.includes("themealdb.com") && !/\/(medium|preview|small|large)$/.test(image) ? `${image}/medium` : image);

/** Re-renders when the device store changes (this tab or another). */
export function useStore<T>(read: () => T, fallback: T): T {
  const cache = useRef<{ value: T; key: string }>({ value: fallback, key: "" }).current;
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(STORE_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(STORE_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      // Return a stable reference while the underlying JSON is unchanged.
      const value = read();
      const key = JSON.stringify(value);
      if (key !== cache.key) {
        cache.value = value;
        cache.key = key;
      }
      return cache.value;
    },
    () => fallback,
  );
}

export const useSaved = () => useStore(listSaved, []);
export const useShopping = () => useStore(listShopping, []);

export function SaveButton({ recipe }: { recipe: Recipe }) {
  const saved = useStore(() => isSaved(recipe.slug), false);
  return (
    <button
      onClick={() => {
        if (toggleSaved({ slug: recipe.slug, href: recipeHref(recipe), title: recipe.title, image: recipe.image, minutes: totalMinutes(recipe) })) recordActivity("saved", "Saved", recipe.title, thumbOf(recipe.image));
      }}
      aria-pressed={saved}
      className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border font-semibold ${saved ? "border-button bg-button text-button-ink" : "border-line"}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 4h12v17l-6-4-6 4z" /></svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export function AddToListButton({ recipe }: { recipe: Recipe }) {
  const [added, setAdded] = useState<number | null>(null);
  function logListed(r: Recipe, count: number) {
    setAdded(count);
    if (count) recordActivity("listed", "Shopping list", `added ${count} item${count === 1 ? "" : "s"} for ${r.title}`, thumbOf(r.image));
  }
  return (
    <button
      onClick={() => logListed(recipe, addToShopping(recipe.slug, recipe.title, recipeHref(recipe), recipe.ingredients.filter((i) => !listPantry().some((p) => covers(p, i.name))).map((i) => i.raw ?? `${i.quantity ? `${i.quantity} ${i.unit === "pc" ? "" : i.unit} ` : ""}${i.name}`.replace(/\s+/g, " ").trim())))}
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line font-semibold"
      aria-live="polite"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
      {added === null ? "Add to list" : added ? `Added ${added}` : "On your list"}
    </button>
  );
}

export function ShareButton({ title, path, className = "" }: { title: string; path: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share sheet dismissed.
    }
  }
  return (
    <button onClick={share} className={`min-h-10 rounded-full bg-button px-4 text-sm font-semibold text-button-ink shadow ${className}`}>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

/** Saved recipes rendered from the device store. */
export function SavedGrid() {
  const saved = useSaved();
  if (!saved.length) return <p className="mt-4 text-muted">Tap Save on any recipe and it will appear here.</p>;
  return (
    <ul className="mt-6 grid grid-cols-2 gap-4">
      {saved.map((r) => (
        <li key={r.slug}>
          <a href={r.href} className="group block">
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote recipe photo
              <img src={r.image.includes("themealdb.com") && !/\/(medium|preview|small|large)$/.test(r.image) ? `${r.image}/medium` : r.image} alt="" className="aspect-square w-full rounded-3xl object-cover" />
            ) : (
              <span className="block aspect-square w-full rounded-3xl bg-surface" />
            )}
            <span className="mt-2 block leading-snug">{r.title}</span>
            <span className="text-sm text-muted">{formatDuration(r.minutes)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const VISITS = "bac-visits";
const REVIEWED = "bac-review-done";

/** Bottom sheet that asks for a rating after a few visits; never shows again once answered. */
export function ReviewPrompt() {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(REVIEWED)) return;
      const visits = Number(localStorage.getItem(VISITS) ?? 0) + 1;
      localStorage.setItem(VISITS, String(visits));
      if (visits >= 3) {
        const t = setTimeout(() => setOpen(true), 1500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  function close(done: boolean) {
    try {
      if (done) localStorage.setItem(REVIEWED, "1");
      else localStorage.setItem(VISITS, "0");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => close(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="step-in mx-auto w-full max-w-lg rounded-t-3xl bg-bg px-6 pb-8 pt-7 text-center" onClick={(e) => e.stopPropagation()}>
        {thanks ? (
          <>
            <h2 id="review-title" className="text-2xl font-semibold">Thank you!</h2>
            <p className="mt-2 text-muted">Your rating helps us decide what to build next.</p>
            <button onClick={() => close(true)} className="mt-6 min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Back to cooking</button>
          </>
        ) : (
          <>
            <h2 id="review-title" className="text-2xl font-semibold">Enjoying Golden?</h2>
            <p className="mt-2 text-muted">How is it helping your cooking? It takes two seconds.</p>
            <div className="mt-5 flex justify-center gap-2" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} className={`h-12 w-12 text-3xl ${n <= stars ? "text-accent" : "text-line"}`}>
                  ★
                </button>
              ))}
            </div>
            <button disabled={!stars} onClick={() => setThanks(true)} className="mt-5 min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:bg-line disabled:text-muted">Send rating</button>
            <button onClick={() => close(false)} className="mt-2 min-h-12 w-full font-medium">Skip for now</button>
          </>
        )}
      </div>
    </div>
  );
}
