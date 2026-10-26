"use client";

// Mob-style full-bleed media card. The loop only plays while the card is on screen, and never
// when the viewer prefers reduced motion.

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Recipe } from "@/lib/types";

const COLOURWAY: Record<Recipe["colourway"], string> = {
  tomato: "bg-tomato",
  basil: "bg-basil",
  saffron: "bg-saffron",
  aubergine: "bg-aubergine",
  charcoal: "bg-charcoal",
};

export function RecipeCard({ recipe, activeMinutes, locked }: { recipe: Recipe; activeMinutes: number; locked: boolean }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={`group relative flex aspect-[4/5] w-64 shrink-0 flex-col justify-end overflow-hidden rounded-3xl p-4 text-white ${COLOURWAY[recipe.colourway]}`}
    >
      {recipe.video ? (
        <video ref={video} src={recipe.video} poster={recipe.image} muted loop playsInline preload="none" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span aria-hidden className="absolute -right-6 -top-6 text-[9rem] leading-none opacity-20 transition-transform group-hover:rotate-6">
          {recipe.title.charAt(0)}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
      <div className="relative">
        <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-white/20 px-2 py-0.5">{activeMinutes} min hands-on</span>
          {locked && <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-black">Premium</span>}
        </div>
        <h3 className="text-xl font-bold leading-tight">{recipe.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-white/80">{recipe.summary}</p>
      </div>
    </Link>
  );
}
