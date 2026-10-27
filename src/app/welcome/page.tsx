import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/site-chrome";
import { RECIPES } from "@/lib/data/recipes";
import { libraryRecipes } from "@/lib/library";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  const pics = [...RECIPES, ...libraryRecipes().slice(10, 16)].flatMap((r) => (r.image ? [{ src: thumb(r.image), title: r.title }] : []));
  const [hero, side, ...tiles] = pics;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-lg flex-col overflow-hidden bg-surface">
      <div className="px-6 pt-10 text-center">
        <Brand className="text-base" />
        <h1 className="mt-6 font-display text-[2.6rem]">
          Learn to cook <span className="text-accent">at your level</span>, one dish at a time
        </h1>
      </div>

      <div aria-hidden className="relative mt-8 h-[22rem] flex-1">
        {side && (
          // eslint-disable-next-line @next/next/no-img-element -- decorative TheMealDB photo
          <img src={side.src} alt="" className="absolute -left-10 top-24 h-56 w-48 -rotate-6 rounded-3xl object-cover shadow-xl" />
        )}
        <div className="absolute -right-6 top-0 w-72 rotate-6 rounded-[2.4rem] border-[7px] border-ink bg-bg p-4 shadow-2xl">
          <p className="font-display text-xl">Discover</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {tiles.slice(0, 4).map((t) => (
              <div key={t.src} className="flex items-center gap-2 rounded-xl bg-surface p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative TheMealDB photo */}
                <img src={t.src} alt="" className="h-8 w-8 rounded-lg object-cover" />
                <span className="line-clamp-2 text-[9px] leading-tight">{t.title}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold">Picked for your level</p>
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element -- decorative TheMealDB photo
            <img src={hero.src} alt="" className="mt-2 h-40 w-full rounded-2xl object-cover" />
          )}
          <p className="mt-2 text-xs font-medium">{hero?.title}</p>
        </div>
      </div>

      <div className="relative z-10 rounded-t-3xl bg-bg px-6 pb-8 pt-6">
        <Link href="/onboarding" className="flex min-h-14 w-full items-center justify-center rounded-full bg-ink text-lg font-semibold text-bg">Get started</Link>
        <Link href="/explore" className="mt-3 flex min-h-12 w-full items-center justify-center text-base font-medium">Browse recipes first</Link>
      </div>
    </main>
  );
}
