import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FridgeIcon, HatIcon, LifebuoyIcon, PanFireIcon, SteamingDishIcon, StopwatchIcon, TrophyIcon } from "@/components/icons-3d";
import { Countdown } from "@/components/landing/countdown";
import { Phone, type Screen } from "@/components/landing/phone";
import { PantryMatcher } from "@/components/pantry-matcher";
import { Brand } from "@/components/site-chrome";
import { TrialTimeline } from "@/components/trial-timeline";
import { launchState } from "@/lib/billing/launch";
import { ATTRACTION, FOUNDING_SPOTS, GUARANTEE, money, offerById, percentOff, perMonth } from "@/lib/billing/offers";
import { RECIPES } from "@/lib/data/recipes";
import { RANKS } from "@/lib/gamify";
import { libraryRecipes } from "@/lib/library";
import { recipeHref } from "@/lib/links";
import { thumb } from "@/lib/mealdb/convert";

export const metadata: Metadata = {
  title: { absolute: "Golden · Stop paying for dinners that end up in the bin" },
  description: "Cook with confidence, waste nothing, level up. Golden turns what's in your fridge into dinner, rescues expensive mistakes and lands every dish hot together.",
};

const executive = offerById("executive")!;
const experience = offerById("experience")!;

/** Sourced estimate: USDA Economic Research Service, food loss for a family of four. */
const FAMILY_WASTE_PER_YEAR = 1500;

/** The whole page in five stops, one tap away: who it's for, why it matters, how it works, price, questions. */
const SECTIONS = [
  ["Who it's for", "#who"],
  ["Why", "#why"],
  ["How", "#how"],
  ["Price", "#pricing"],
  ["Questions", "#faq"],
];

/** The people Golden is built for, in their own moment. */
const WHO = [
  {
    title: "Ambitious professionals",
    photo: "/landing/avatar-professional.jpg",
    alt: "A professional woman in a blazer cooking a quick stir-fry after work",
    moment: "You want real food, not another takeaway. You've got about 30 minutes and whatever is in the fridge.",
    gets: "Tonight's dinner from what you already have, step by step.",
  },
  {
    title: "Busy parents",
    photo: "/landing/avatar-parent.jpg",
    alt: "A father and his young daughter laughing while they cook dinner together",
    moment: "The grocery bill keeps going up, some of it still ends up in the bin, and everyone wants something different.",
    gets: "Meals from food you've already bought, all ready at the same time.",
  },
  {
    title: "Home cooking enthusiasts",
    photo: "/landing/avatar-enthusiast.jpg",
    alt: "A home cook serving a multi-course dinner to friends by candlelight",
    moment: "Three dishes at once means cold food, an expensive cut you're scared to ruin, and you stuck at the stove.",
    gets: "Every dish lands hot together, so you sit down with them.",
  },
];

/** Why it matters: what bad dinners cost them, then what changes. */
const WHY: { kind: string; Icon: (p: { size?: number }) => ReactNode; pain: string; fix: string; win: string }[] = [
  {
    kind: "Your money",
    Icon: FridgeIcon,
    pain: "You pay for food twice: once at the shop, again when the forgotten vegetables go in the bin, the expensive cut comes out grey and tough, and dinner turns into a takeaway.",
    fix: "Cook what's already in your fridge, and save the dish when something goes wrong.",
    win: "Less in the bin, fewer emergency shops.",
  },
  {
    kind: "Your well-being",
    Icon: SteamingDishIcon,
    pain: "It's 7 PM and \"what's for dinner?\" is one decision too many. So it's something processed again, or two draining hours at the stove.",
    fix: "One clear pick for tonight, written for your level, one step at a time.",
    win: "Real food in about 30 minutes, without the stress.",
  },
  {
    kind: "Your people",
    Icon: PanFireIcon,
    pain: "The steak goes cold while the potatoes finish, and you spend the evening at the stove while everyone else is talking.",
    fix: "Every dish timed to land hot together, with a nudge when to start each one.",
    win: "Dinner on time, and you at the table.",
  },
];

/** How, part 1: what you get. Benefits first, in plain words. */
const BENEFITS: { title: string; text: string; Icon: (p: { size?: number }) => ReactNode }[] = [
  { title: "Dinner from what you already have", text: "No special shop. The food you bought gets eaten, not binned.", Icon: FridgeIcon },
  { title: "Expensive mistakes, saved", text: "Too salty, split or overcooked? Fixed in seconds, not thrown away.", Icon: LifebuoyIcon },
  { title: "Everything hot, together", text: "Two, three or four dishes ready at the same minute, without the juggling.", Icon: StopwatchIcon },
  { title: "Better every time you cook", text: "Recipes pitched at your level, and XP, streaks and chef ranks as you improve.", Icon: TrophyIcon },
];

/** How, part 2: the features that deliver those benefits. */
const FEATURES: { name: string; benefit: string; text: string; screen: Screen; Icon: (p: { size?: number }) => ReactNode }[] = [
  {
    name: "Skill-Adaptation Engine",
    benefit: "Get it right the first time",
    text: "Every recipe is rewritten for your level: small steps and \"what it should look like\" cues for beginners, pro shorthand for confident cooks. No more guessing with expensive ingredients.",
    screen: "cook",
    Icon: HatIcon,
  },
  {
    name: "'Fix My Mistake' AI Doctor",
    benefit: "Save the dish, not the bin",
    text: "Snap a photo or tap what you see. You get the exact fix and the amounts for your pan, in seconds.",
    screen: "fix",
    Icon: LifebuoyIcon,
  },
  {
    name: "Multi-Dish Timing Orchestrator",
    benefit: "Every dish hot, together",
    text: "Up to four recipes become one timeline. Golden staggers every start, gives you one hands-on task at a time, and chimes when it's time to switch.",
    screen: "timeline",
    Icon: PanFireIcon,
  },
];

/** What's included, with what each part is worth to you. */
const INCLUDED = [
  { name: "Pantry-to-Plate Matcher", value: 80 },
  { name: "'Fix My Mistake' AI Doctor", value: 120 },
  { name: "Multi-Dish Timing Orchestrator", value: 150 },
  { name: "Chinese, Korean & Italian technique modules", value: 100 },
  { name: "Recipes rewritten for your level + hands-free cook mode", value: 50 },
];

/** Plan benefits, said before the feature list on each price card. */
const PLAN_BENEFITS = {
  executive: ["Stop binning the food you buy", "Save expensive dishes when they go wrong", "Every dish hot, together, with less stress", "Get better every time you cook"],
  experience: ["Get recipes right the first time", "Calm, step-by-step cooking, one dish at a time"],
};

/** The free days, simply: a benefit, then the feature that delivers it in brackets. */
const TRIAL_DAYS = [
  "Day 1: Cook what you already have (Pantry-to-Plate)",
  "Day 2: Recipes at your level (Skill-Adaptation Engine)",
  "Day 3: Two dishes, hot together (Timing Orchestrator)",
  "Day 4: Save a dish, don't bin it (Fix My Mistake)",
  "Day 5: Cook once, eat twice (Hands-free Cook Mode)",
];

const FAQ = [
  ["How fast will I see value?", "Tonight. Tell Golden what's in your fridge and you get a dinner that uses it, timed and written for your level, in about a minute."],
  ["What happens in the free 5 days?", `Every feature is yours, whichever plan you pick. ${TRIAL_DAYS.join(". ")}. Your plan starts after day 5; cancel before then and pay nothing.`],
  ["What's the difference between the two plans?", `The Golden Experience (${money(experience.price)}/year) gives you recipes rewritten for your level and cook mode, one dish at a time. The Executive Chef System (${money(executive.price)}/year) adds the timing orchestrator, the Fix My Mistake AI Doctor, Pantry-to-Plate, the technique modules and the money-back guarantee.`],
  ["Why is it 80% off?", `The founding price is for the first ${FOUNDING_SPOTS.toLocaleString("en-US")} members only, until the countdown ends. After that the Executive Chef System is ${money(executive.regularPrice ?? executive.price)}/year. Founding members keep their price for as long as they stay.`],
  ["How does the money-back guarantee work?", `Cook ${GUARANTEE.dishes} full meals with Golden. If you don't get every dish on the table hot and on time, rescue at least one mistake, and see a real drop in your weekly food waste, send us your session log within ${GUARANTEE.days} days of purchase for a 100% refund.`],
  ["How do I cancel? Does it work on my phone?", "Cancel any time in two taps from your account. Golden runs on iPhone, Android and any browser, and cook mode keeps your screen awake while you cook."],
];

export default async function LandingPage() {
  const launch = await launchState();
  const pct = percentOff(executive);
  const endDate = new Date(launch.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const totalValue = INCLUDED.reduce((s, v) => s + v.value, 0);
  const wastePerWeek = Math.round(FAMILY_WASTE_PER_YEAR / 52);
  const recipes = [...RECIPES, ...libraryRecipes()].map((r) => ({
    slug: r.slug,
    href: recipeHref(r),
    title: r.title,
    image: r.image ? thumb(r.image) : undefined,
    ingredients: r.ingredients.map((i) => i.name),
  }));

  return (
    <div className="min-h-dvh overflow-x-hidden bg-black font-sans text-white [&_[id]]:scroll-mt-44">
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-xl">
        {/* The real founding offer: spots counted in Supabase, fixed end date */}
        <a href="#pricing" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#facc15] px-3 py-2 text-center text-sm font-semibold text-black">
          <span>{launch.open ? `${pct}% off founding price ends in` : "Founding price"}</span>
          <Countdown endsAt={launch.endsAt} compact />
          <span className="rounded-full bg-black px-2.5 py-0.5 text-[#facc15]">{launch.left.toLocaleString("en-US")} of {launch.spots.toLocaleString("en-US")} spots left</span>
        </a>
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-3 sm:px-6">
          <Link href="/landing" aria-label="Golden home"><Brand className="text-2xl text-white sm:text-3xl" /></Link>
          <Link href="/signin" className="rounded-full bg-[#facc15] px-5 py-2.5 text-[15px] font-semibold text-black transition hover:bg-[#fde047] sm:px-6">Try free</Link>
        </nav>
        <nav aria-label="Sections" className="mx-auto max-w-6xl overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6">
          <ol className="flex w-max gap-2">
            {SECTIONS.map(([label, href], i) => (
              <li key={href}><a href={href} className="block whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 transition hover:border-[#facc15] hover:text-white"><span className="mr-1.5 text-[#facc15]">{i + 1}</span>{label}</a></li>
            ))}
          </ol>
        </nav>
      </header>

      <main>
        {/* Hero: the promise, then what it means for their wallet, tonight */}
        <section className="relative pb-16 pt-10 text-center sm:pt-16">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[36rem] max-w-4xl bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.18),transparent_65%)]" />
          <h1 className="relative mx-auto max-w-3xl px-5 font-display text-[2.4rem] leading-[1.05] sm:text-6xl">
            Never Waste <span className="text-gold">Groceries</span> Again.
          </h1>
          <p className="relative mx-auto mt-8 max-w-2xl px-5 text-lg leading-relaxed text-white/75 sm:text-xl">
            Golden turns your fridge into tonight&apos;s dinner before expensive ingredients spoil. It guides you from beginner to chef and times every dish to land hot together.
          </p>
          <div className="relative mx-auto mt-9 flex max-w-xl flex-col gap-3 whitespace-nowrap px-5 sm:flex-row sm:justify-center">
            <Link href="/signin" className="rounded-full bg-[#facc15] px-8 py-4 text-lg font-semibold text-black transition hover:bg-[#fde047]">Start free: $0 today</Link>
            <a href="#how" className="rounded-full border border-white/20 px-8 py-4 text-lg font-semibold transition hover:bg-white/10">Try it on your fridge</a>
          </div>
          <p className="relative mt-4 text-sm text-white/55">Your first dinner tonight · {ATTRACTION.days} days free · cancel in two taps</p>

          <div className="relative mx-auto mt-16 flex max-w-5xl items-end justify-center gap-2 px-5">
            <div className="hidden translate-y-10 md:block"><Phone screen="discover" tilt="left" /></div>
            <Phone screen="plan" tilt="none" priority className="z-10" />
            <div className="hidden translate-y-10 md:block"><Phone screen="fix" tilt="right" /></div>
          </div>
        </section>

        {/* 1. Who it's for: the specific people, in their own moment */}
        <section id="who" className="px-5 py-20 sm:py-28" aria-labelledby="who-title">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#facc15]">1 · Who it&apos;s for</p>
          <h2 id="who-title" className="mx-auto mt-3 max-w-4xl text-center text-4xl font-bold tracking-tight sm:text-6xl">
            If you&apos;ve ever thrown away <span className="text-gold">food you paid for</span>
          </h2>
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
            {WHO.map((w) => (
              <article key={w.title} className="relative flex min-h-[30rem] flex-col justify-end overflow-hidden rounded-[2.5rem] p-7">
                <Image src={w.photo} alt={w.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-black/55 to-black/95" />
                <div className="relative">
                  <h3 className="text-2xl font-semibold">{w.title}</h3>
                  <p className="mt-3 text-white/75">{w.moment}</p>
                  <p className="mt-4 border-t border-white/15 pt-4 font-medium text-[#fde68a]">Golden: {w.gets}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 2. Why: what bad dinners cost you, in money, well-being and people */}
        <section id="why" className="px-5 py-20" aria-labelledby="why-title">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#facc15]">2 · Why</p>
          <h2 id="why-title" className="mx-auto mt-3 max-w-4xl text-center text-3xl font-semibold leading-snug sm:text-5xl sm:leading-tight">
            <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              A family of four throws away around ${FAMILY_WASTE_PER_YEAR.toLocaleString("en-US")} of food a year. That&apos;s about {money(wastePerWeek)} every week, gone.
            </span>
          </h2>
          <p className="mt-4 text-center text-sm text-white/40">Estimate: USDA Economic Research Service.</p>
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">
            {WHY.map((c) => (
              <article key={c.kind} className="rounded-[2.2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-7">
                <div className="flex items-center gap-3"><c.Icon size={44} /><h3 className="text-2xl font-bold">{c.kind}</h3></div>
                <p className="mt-4 text-white/70">{c.pain}</p>
                <div className="mt-5 rounded-2xl bg-[#facc15]/10 p-4">
                  <p className="text-white/85">{c.fix}</p>
                  <p className="mt-2 font-semibold text-[#fde68a]">{c.win}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 3. How: the benefits first, then the features that deliver them, then a free try */}
        <section id="how" className="px-5 py-20" aria-labelledby="how-title">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#facc15]">3 · How</p>
          <h2 id="how-title" className="mx-auto mt-3 max-w-4xl text-center text-4xl font-bold tracking-tight sm:text-6xl">
            What you get, <span className="text-gold">starting tonight</span>
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- Golden's own photo */}
          <img src="/photos/spices.jpg" alt="Spices on silver spoons with fresh herbs and chillies" loading="lazy" className="mx-auto mt-10 aspect-[16/9] w-full max-w-6xl rounded-[2rem] object-cover sm:aspect-[21/9]" />
          <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <article key={b.title} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                <b.Icon size={44} />
                <h3 className="mt-4 text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 text-white/60">{b.text}</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-6 flex max-w-6xl snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none]" aria-label="Chef ranks you unlock">
            {RANKS.map((r, i) => (
              <span key={r.title} className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-white/10 py-1.5 pl-1.5 pr-4 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#facc15_40%,#a6761d_85%)] text-xs font-black text-black/70">{i + 1}</span>
                {r.title}
              </span>
            ))}
          </div>

          <h3 className="mx-auto mt-24 max-w-4xl text-center text-3xl font-bold sm:text-5xl">The features that <span className="text-gold">make it happen</span></h3>
          <div className="mx-auto mt-16 max-w-6xl space-y-28">
            {FEATURES.map((f, i) => (
              <div key={f.name} className={`flex flex-col items-center gap-14 md:flex-row ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-white/70"><f.Icon size={22} />{f.benefit}</span>
                  <h4 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{f.name}</h4>
                  <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/65">{f.text}</p>
                </div>
                <div className="flex-1"><Phone screen={f.screen} tilt={i % 2 ? "left" : "right"} /></div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-24 max-w-4xl overflow-hidden rounded-[2rem] border border-white/10">
            <p className="bg-white/[0.04] p-6 text-lg font-semibold">Everything in the Executive Chef System</p>
            <ul className="divide-y divide-white/10">
              {INCLUDED.map((v) => (
                <li key={v.name} className="flex items-center justify-between gap-6 px-6 py-4">
                  <span>{v.name}</span>
                  <span className="shrink-0 text-white/50">worth {money(v.value)}/yr</span>
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap items-center justify-between gap-2 bg-[#facc15]/10 p-6 text-lg">
              <span className="font-semibold">You pay</span>
              <span><span className="mr-3 text-white/40 line-through">{money(totalValue)}/yr</span><span className="font-bold text-[#facc15]">{money(executive.price)}/yr founding price</span></span>
            </p>
          </div>

          {/* Free value first: no sign-up, real recipes, right now */}
          <div className="mx-auto mt-16 max-w-3xl rounded-[2.2rem] bg-white p-6 text-[#1f1d1b] sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#b45309]">Free, no sign-up</p>
            <h3 className="mt-1 text-3xl font-bold">What&apos;s in your fridge right now?</h3>
            <p className="mt-2 text-[#57534e]">Type it in and see what you could cook tonight instead of throwing it away.</p>
            <PantryMatcher recipes={recipes} />
          </div>
        </section>

        {/* 4. Price: anchored against what waste costs, clear timeline, real scarcity, no risk */}
        <section id="pricing" className="px-5 py-20" aria-labelledby="pricing-title">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#facc15]">4 · Price</p>
          <h2 id="pricing-title" className="mt-3 text-center text-4xl font-bold tracking-tight sm:text-6xl">Less than <span className="text-gold">one week of waste</span></h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            <p className="rounded-2xl border border-white/10 p-4 text-center"><span className="block text-3xl font-bold">{money(wastePerWeek)}</span><span className="text-sm text-white/55">food the average family bins each week</span></p>
            <p className="rounded-2xl border border-white/10 p-4 text-center"><span className="block text-3xl font-bold">1 steak</span><span className="text-sm text-white/55">ruined costs more than a month of Golden</span></p>
            <p className="rounded-2xl border-2 border-[#facc15] p-4 text-center"><span className="block text-3xl font-bold text-[#facc15]">{perMonth(executive)}</span><span className="text-sm text-white/55">a month for Golden, billed yearly</span></p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl items-start gap-5 lg:grid-cols-3">
            <PriceCard
              name={ATTRACTION.name}
              sub="Start here, free"
              price="$0"
              per=""
              note={`Every feature free for ${ATTRACTION.days} days`}
              benefits={["Save money from day one", "Try everything, pay nothing"]}
              items={TRIAL_DAYS}
              cta="Start free"
            />
            <PriceCard
              name={experience.name}
              sub="One dish at a time"
              price={money(experience.price)}
              per="/year"
              note={`${perMonth(experience)}/month, billed yearly`}
              benefits={PLAN_BENEFITS.experience}
              items={experience.includes}
              missing={experience.excludes}
              cta="Choose Experience"
            />
            <PriceCard
              featured
              name={executive.name}
              sub="Stop the waste for good"
              price={money(executive.price)}
              was={executive.regularPrice ? money(executive.regularPrice) : undefined}
              per="/year"
              note={`${perMonth(executive)}/month · ${pct}% off for founding members`}
              benefits={PLAN_BENEFITS.executive}
              items={executive.includes}
              cta="Claim my founding spot"
            />
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 p-7">
              <h3 className="text-2xl font-semibold">How your free days work</h3>
              <p className="mt-1 text-white/60">No surprises: here&apos;s exactly what happens and when.</p>
              <div className="mt-6"><TrialTimeline days={ATTRACTION.days} price={`${money(executive.price)} for the year`} tone="dark" /></div>
            </div>
            <div className="rounded-[2rem] border border-[#facc15]/30 bg-[#facc15]/[0.06] p-7 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#facc15]">Founding price ends {endDate}</p>
              <p className="mt-2 text-2xl font-semibold">{launch.taken.toLocaleString("en-US")} of {launch.spots.toLocaleString("en-US")} founding spots taken</p>
              <div className="mx-auto mt-4 h-3 max-w-sm overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={launch.spots} aria-valuenow={launch.taken} aria-label="Founding spots taken">
                <div className="h-full rounded-full bg-gradient-to-r from-[#a6761d] to-[#facc15]" style={{ width: `${Math.max(1, (launch.taken / launch.spots) * 100)}%` }} />
              </div>
              <div className="mt-6"><Countdown endsAt={launch.endsAt} /></div>
              <p className="mt-5 text-sm text-white/60">Then the Executive Chef System goes back to {money(executive.regularPrice ?? executive.price)}/year. Founding members keep {money(executive.price)}/year for as long as they stay.</p>
            </div>
          </div>

          <div id="guarantee" className="mx-auto mt-5 max-w-5xl rounded-[2rem] bg-gradient-to-b from-[#2a2208] to-[#0c0a05] p-7 sm:flex sm:items-center sm:gap-7 sm:p-9">
            <span aria-hidden className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#facc15_45%,#a6761d)] text-3xl font-black text-black/75 sm:mx-0">{GUARANTEE.dishes}</span>
            <div className="mt-4 text-center sm:mt-0 sm:text-left">
              <h3 className="text-2xl font-bold">The {GUARANTEE.dishes} Perfect Dishes <span className="text-gold">Money-Back Guarantee</span></h3>
              <p className="mt-2 text-white/70">Cook {GUARANTEE.dishes} meals with Golden. If they don&apos;t land hot and on time, you never rescue a mistake, and your weekly waste doesn&apos;t drop, send us your session log within {GUARANTEE.days} days for a 100% refund. <Link href="/guarantee" className="underline">Full terms</Link></p>
            </div>
          </div>
        </section>

        {/* 5. Questions, then one last clear step */}
        <section id="faq" className="px-5 py-20" aria-labelledby="faq-title">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#facc15]">5 · Questions</p>
          <h2 id="faq-title" className="mt-3 text-center text-4xl font-bold tracking-tight sm:text-5xl">Good questions</h2>
          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-7 py-6 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-3xl font-light transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 leading-relaxed text-white/65">{a}</p>
              </details>
            ))}
          </div>

          <div className="mx-auto mt-20 max-w-3xl text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- Golden's own photo */}
            <img src="/photos/chef-chopping.jpg" alt="A cook halving cherry tomatoes on a wooden board" loading="lazy" className="mb-10 aspect-[16/9] w-full rounded-[2rem] object-cover" />
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">Tonight&apos;s dinner, <span className="text-gold">from what you already have</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">Start free, cook something good tonight, and decide in {ATTRACTION.days} days. On iPhone, Android and the web.</p>
            <Link href="/signin" className="mt-8 inline-block rounded-full bg-[#facc15] px-10 py-4 text-lg font-semibold text-black transition hover:bg-[#fde047]">Start free: $0 today</Link>
            <p className="mt-4 text-sm text-white/50">Already a member? <Link href="/signin" className="underline">Sign in</Link></p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-10 text-sm text-white/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Brand className="text-xl text-white" />
          <div className="flex gap-6">
            <Link href="/guarantee" className="hover:text-white">Guarantee</Link>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <p>© {new Date().getFullYear()} Golden</p>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({ name, sub, price, was, per, note, benefits, items, missing = [], cta, featured }: { name: string; sub: string; price: string; was?: string; per: string; note: string; benefits: string[]; items: string[]; missing?: string[]; cta: string; featured?: boolean }) {
  return (
    <article className={`relative rounded-[2.2rem] p-7 ${featured ? "border-2 border-[#facc15] bg-gradient-to-b from-[#241d07] to-[#0b0a06] shadow-[0_0_60px_-10px_rgba(250,204,21,0.35)] lg:-mt-6" : "border border-white/10 bg-gradient-to-b from-[#121212] to-black"}`}>
      {featured && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#facc15] px-4 py-1 text-sm font-bold text-black">Best value · 80% off</span>}
      <h3 className={`text-2xl font-bold ${featured ? "text-gold" : "bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"}`}>{name}</h3>
      <p className="mt-1 text-white/60">{sub}</p>
      <p className="mt-6 flex items-end gap-2">
        {was && <span className="pb-2 text-2xl text-white/35 line-through">{was}</span>}
        <span className="text-6xl font-bold tracking-tight">{price}</span>
        <span className="pb-2 text-xl font-semibold">{per}</span>
      </p>
      <p className="mt-3 border-t border-white/10 pt-3 text-center text-sm text-white/50">{note}</p>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/50">What you get</p>
      <ul className="mt-3 space-y-2">
        {benefits.map((b) => <li key={b} className="flex gap-3 text-lg font-semibold"><span aria-hidden className="text-[#facc15]">★</span><span>{b}</span></li>)}
      </ul>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/50">What&apos;s inside</p>
      <ul className="mt-3 space-y-3">
        {items.map((i) => {
          // "Benefit (Feature name)": the feature name stays on one line, quieter than the benefit.
          const m = /^(.*?)\s*\(([^)]+)\)$/.exec(i);
          return (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="text-[#facc15]">✓</span>
              <span className="text-white/85">{m ? <>{m[1]} <span className="whitespace-nowrap text-white/50">({m[2]})</span></> : i}</span>
            </li>
          );
        })}
        {missing.map((i) => <li key={i} className="flex gap-3 text-white/35"><span aria-hidden>✕</span><span className="line-through">{i}</span></li>)}
      </ul>
      <Link href="/signin" className={`mt-8 flex min-h-14 flex-col items-center justify-center rounded-full text-lg font-semibold transition ${featured ? "bg-[#facc15] text-black hover:bg-[#fde047]" : "border border-white/20 hover:bg-white/10"}`}>{cta}</Link>
      <p className="mt-2 text-center text-xs text-white/45">$0 today · cancel before day {ATTRACTION.days} ends, pay nothing</p>
    </article>
  );
}
