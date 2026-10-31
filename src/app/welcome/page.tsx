import type { Metadata } from "next";
import Link from "next/link";
import { HatIcon, LifebuoyIcon, PanFireIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { Brand } from "@/components/site-chrome";
import { RECIPES } from "@/lib/data/recipes";
import { GIVEAWAY } from "@/lib/giveaway";
import { libraryRecipes } from "@/lib/library";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = { title: "Welcome" };

/** The problems we solve, and how Golden solves each (money, time, growth). */
const VALUE = [
  {
    Icon: LifebuoyIcon,
    problem: "Ruined food is wasted money",
    detail: "An overcooked steak, a split sauce or burnt garlic and dinner goes in the bin.",
    solution: "Fix My Mistake rescues it in real time, with exact amounts for your pan. Save two or three dinners and Golden has paid for its year.",
  },
  {
    Icon: PanFireIcon,
    problem: "Cooking several dishes is overwhelming",
    detail: "Something is always cold, raw or burning while you watch another pan.",
    solution: "The timing orchestrator staggers every start, with chimes and phone vibration, so main and sides land hot at the same moment.",
  },
  {
    Icon: HatIcon,
    problem: "Recipes ignore your skill level",
    detail: "Too vague for nervous beginners, too slow for confident cooks.",
    solution: "Every recipe rewrites itself for you: Beginner micro-steps, Intermediate shorthand, Chef technique and science, switchable mid-cook.",
  },
];

const COMPARE = [
  { label: "Recipe structure", them: "Static text, fixed steps", us: "Rewrites for Beginner, Intermediate or Chef" },
  { label: "When it goes wrong", them: "You're on your own", us: "Fix My Mistake recovery, on the spot" },
  { label: "Several dishes at once", them: "Guesswork", us: "Orchestrated timeline with alerts" },
  { label: "Community", them: "Comment sections", us: "Apprentice Meets Master: real feedback" },
  { label: "Groceries", them: "Buy the full list", us: "Pantry-first: cook what you already have" },
];

const PILLARS = [
  { Icon: SteamingDishIcon, title: "Your time", text: "Clear micro-steps and parallel timers replace re-reading, guessing and starting over." },
  { Icon: LifebuoyIcon, title: "Your money", text: "Fewer ruined meals and pantry-first cooking cut waste and impulse buys." },
  { Icon: TrophyIcon, title: "Your people", text: "Share dishes, get tips from Chef-level cooks, and level up together." },
];

export default function WelcomePage() {
  const pics = [...RECIPES, ...libraryRecipes().slice(10, 16)].flatMap((r) => (r.image ? [{ src: thumb(r.image), title: r.title }] : []));
  const [hero, side, ...tiles] = pics;
  const drawDate = new Date(GIVEAWAY.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

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

      <section className="mt-6 space-y-4 bg-bg px-6 pb-4 pt-10" aria-labelledby="problems">
        <h2 id="problems" className="font-display text-[1.9rem]">The problems we solve</h2>
        {VALUE.map(({ Icon, problem, detail, solution }) => (
          <article key={problem} className="rounded-3xl border border-line p-5">
            <div className="flex items-center gap-3">
              <Icon size={40} />
              <h3 className="text-lg font-semibold leading-tight">{problem}</h3>
            </div>
            <p className="mt-2 text-muted">{detail}</p>
            <p className="mt-3 rounded-2xl bg-accent-soft p-3"><strong>Golden:</strong> {solution}</p>
          </article>
        ))}
      </section>

      <section className="bg-bg px-6 py-8" aria-labelledby="compare">
        <h2 id="compare" className="font-display text-[1.9rem]">Why Golden, not another recipe app</h2>
        <div className="mt-4 overflow-hidden rounded-3xl border border-line">
          <div className="grid grid-cols-[1fr_1fr_1.2fr] bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
            <span />
            <span>Typical apps</span>
            <span className="text-ink">Golden</span>
          </div>
          {COMPARE.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_1fr_1.2fr] gap-2 border-t border-line px-4 py-3 text-sm">
              <span className="font-semibold">{row.label}</span>
              <span className="text-muted">{row.them}</span>
              <span className="flex gap-1.5"><span aria-hidden className="text-basil">✓</span>{row.us}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-bg px-6 pb-8" aria-labelledby="pillars">
        <h2 id="pillars" className="font-display text-[1.9rem]">
          $45 a year that <span className="text-accent">gives back more</span>
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

      <section className="mx-6 mb-6 rounded-3xl bg-charcoal p-6 text-white" aria-labelledby="giveaway">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#facc15]">The Golden Giveaway</p>
        <h2 id="giveaway" className="mt-1 font-display text-[1.8rem] text-white">Win a free year, and one for the friend who invited you</h2>
        <p className="mt-2 text-white/80">Free to enter after you sign up. Share your link to give friends a chance, and if one of them wins, you win a year too. Draw on {drawDate}.</p>
        <Link href="/giveaway" className="mt-3 inline-block text-sm underline">Official rules</Link>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg rounded-t-3xl bg-bg px-6 pb-6 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <Link href="/signin" className="flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Start leveling up: 7 days free</Link>
        <Link href="/signin" className="mt-2 flex min-h-11 w-full items-center justify-center text-base font-medium">I already have an account</Link>
      </div>
    </main>
  );
}
