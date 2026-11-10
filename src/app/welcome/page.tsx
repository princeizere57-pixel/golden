import type { Metadata } from "next";
import Link from "next/link";
import { LifebuoyIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { Brand } from "@/components/site-chrome";
import { RECIPES } from "@/lib/data/recipes";
import { TRIAL_HEADLINE_DAYS } from "@/lib/billing/offers";
import { libraryRecipes } from "@/lib/library";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Welcome" };

const PILLARS = [
  { Icon: SteamingDishIcon, title: "Your time", text: "Clear micro-steps and parallel timers replace re-reading, guessing and starting over." },
  { Icon: LifebuoyIcon, title: "Your money", text: "Fewer ruined meals and pantry-first cooking cut waste and impulse buys." },
  { Icon: TrophyIcon, title: "Your people", text: "Share dishes, get tips from Chef-level cooks, and level up together." },
];

export default function WelcomePage() {
  const pics = [...RECIPES, ...libraryRecipes().slice(10, 16)].flatMap((r) => (r.image ? [{ src: thumb(r.image), title: r.title }] : []));
  const [hero, side, ...tiles] = pics;

  return (
    <main className="relative mx-auto min-h-dvh max-w-lg bg-surface pb-40">
      <section className="px-6 pt-10 text-center">
        <Brand className="text-5xl" />
        <h1 className="mt-6 font-display text-[2.45rem]">
          Cook with confidence, <span className="text-accent">waste nothing</span>, level up
        </h1>
        <p className="mt-4 text-[17px] text-muted">
          Kitchen anxiety, ruined ingredients and dishes that never finish together cost home cooks money, time and confidence every week.
        </p>
      </section>

      <div aria-hidden className="relative mt-6 h-[22rem]">
        {side && (
          // eslint-disable-next-line @next/next/no-img-element -- decorative TheMealDB photo
          <img src={side.src} alt="" className="absolute -left-10 top-24 h-56 w-48 -rotate-6 rounded-3xl object-cover shadow-xl" />
        )}
        <div className="absolute -right-6 top-0 w-72 rotate-6 rounded-[2.4rem] border-[7px] border-button bg-bg p-4 shadow-2xl">
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
        </div>
      </div>

      <section className="mt-6 bg-bg px-6 py-8" aria-labelledby="pillars">
        <h2 id="pillars" className="font-display text-[1.9rem]">
          What Golden <span className="text-accent">gives back</span>
        </h2>
        <p className="mt-2 text-muted">Our estimate: $100–$300 a year back in rescued ingredients, plus calmer cooking.</p>
        <div className="mt-4 grid gap-3">
          {PILLARS.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl bg-surface p-4">
              <Icon size={36} />
              <p><strong>{title}.</strong> {text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] rounded-t-3xl bg-bg px-6 pb-6 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <Link href="/signin" className="flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Start leveling up: {TRIAL_HEADLINE_DAYS} days free</Link>
        <Link href="/signin" className="mt-2 flex min-h-11 w-full items-center justify-center text-base font-medium">I already have an account</Link>
      </div>
    </main>
  );
}
