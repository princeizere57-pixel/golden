import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FlameIcon, HatIcon, LifebuoyIcon, PanFireIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { Countdown } from "@/components/landing/countdown";
import { DoctorScreen, PantryScreen, Phone, SkillScreen, TimelineScreen } from "@/components/landing/phone";
import { Brand } from "@/components/site-chrome";
import { launchState } from "@/lib/billing/launch";
import { ATTRACTION, GUARANTEE, money, offerById, percentOff, perMonth } from "@/lib/billing/offers";
import { RANKS } from "@/lib/gamify";

export const metadata: Metadata = {
  title: "Golden · The Executive Chef System for your kitchen",
  description: "For the professional or parent walking in at 7 PM: turn leftovers into dinner, rescue mistakes in seconds, and land every dish hot at the same minute.",
};

const executive = offerById("executive")!;
const experience = offerById("experience")!;

const NAV = [
  ["Problem", "#problem"],
  ["How it works", "#system"],
  ["Pricing", "#pricing"],
  ["Guarantee", "#guarantee"],
  ["FAQ", "#faq"],
];

const AVATARS = [
  {
    title: "Ambitious professionals",
    pain: "You need real, nutrient-dense food to perform, but you don't have hours to plan, shop and babysit pans.",
    win: "Dinner planned from what you already have, cooked in under 35 hands-on minutes.",
    tint: "from-[#5b4a12] to-[#14110a]",
  },
  {
    title: "Busy parents",
    pain: "Different tastes, tight schedules and the nightly pressure to put something healthy on the table.",
    win: "One timeline for the whole family meal, so nothing burns while you help with homework.",
    tint: "from-[#5a3518] to-[#140d08]",
  },
  {
    title: "Home cooking enthusiasts",
    pain: "You know the basics, but multi-course timing and hosting turn into stress at the stove.",
    win: "Restaurant-style pacing and technique modules, so you cook freely and stay with your guests.",
    tint: "from-[#3e4416] to-[#10110a]",
  },
];

const FRUSTRATIONS = [
  ["Meal timing breakdown", "The steak goes cold while the potatoes finish. Courses arrive out of order."],
  ["Ingredient waste", "Forgotten produce rots in the crisper drawer. Another grocery run for one item."],
  ["Decision fatigue", "\"What's for dinner?\" Every single day, after a full day of decisions."],
  ["Multi-dish chaos", "Two burners, one oven, three dishes and no idea what goes first."],
];

const PILLARS: { tag: string; title: string; mechanism: string; text: string; screen: ReactNode; Icon: (p: { size?: number }) => ReactNode }[] = [
  {
    tag: "Pillar I · Prevention",
    title: "Mistakes stopped before they start",
    mechanism: "Skill-Adaptation Engine",
    text: "Every recipe recalibrates to your level and your kitchen: micro-steps and sensory cues for beginners, pro shorthand for confident cooks, technique and food science for chefs. Switch levels mid-cook.",
    screen: <SkillScreen />,
    Icon: HatIcon,
  },
  {
    tag: "Pillar II · Intervention",
    title: "Your dish, rescued in seconds",
    mechanism: "'Fix My Mistake' AI Doctor",
    text: "Too salty, split, burnt or bland? Snap a photo or tap what you see. You get exact amounts for your pan, built on acid, fat, salt, sugar and heat, before dinner goes in the bin.",
    screen: <DoctorScreen />,
    Icon: LifebuoyIcon,
  },
  {
    tag: "Pillar III · Execution",
    title: "Every dish lands hot, together",
    mechanism: "Multi-Dish Timing Orchestrator",
    text: "Up to four recipes merge into one master timeline. Golden staggers every start, gives you one active task at a time, and chimes and vibrates when it's time to switch.",
    screen: <TimelineScreen />,
    Icon: PanFireIcon,
  },
];

const PAINS = [
  {
    kind: "Wealth",
    pain: "The average US family of four throws away around $1,500 of food a year, then pays again for takeout.",
    fix: "Pantry-to-Plate Optimization",
    how: "Turns what's already in your fridge into dinner and only lists what you're missing.",
  },
  {
    kind: "Health",
    pain: "Ultra-processed meals, eating out, or two disconnected, exhausting hours at the stove every night.",
    fix: "Streamlined Execution Pathways",
    how: "Whole-food meals in under 35 minutes of hands-on time, one clear step at a time.",
  },
  {
    kind: "Relationships",
    pain: "Hosting anxiety, cold food, and being stuck at the stove while everyone else is talking.",
    fix: "Synchronized Table Landing",
    how: "You control the clock, so you serve hot, multi-course meals and stay with your people.",
  },
];

const VALUE_STACK = [
  { name: "Multi-Dish Synchronized Timing Orchestrator", benefit: "No more juggling oven temperatures, pan space and staging. Everything finishes hot at the same minute.", value: 150 },
  { name: "'Fix My Mistake' AI Doctor", benefit: "Rescues costly ingredients from the bin and removes the panic of a ruined dinner.", value: 120 },
  { name: "Pantry-to-Plate Matcher", benefit: "Answers \"what's for dinner?\" from your own fridge and gets more from every grocery trip.", value: 80 },
  { name: "Chinese, Korean & Italian Culinary Arts Modules", benefit: "Wok heat control, fermentation and balance, pan sauces and pasta texture: technique, not memorizing.", value: 100 },
  { name: "Skill-Adaptation Engine + hands-free cook mode", benefit: "Recipes rewritten for your level, with timers, chimes and a screen that stays on.", value: 50 },
];

const EQUATION = [
  ["Dream outcome", "Flawless multi-dish meals, far less food waste, restaurant-quality home cooking and real kitchen confidence."],
  ["Likelihood of success", "A timing engine, skill-adapted steps and an AI Doctor on standby. You're never cooking alone."],
  ["Time to results", "Instant onboarding and your first planned meal within 15 minutes of signing up."],
  ["Effort and sacrifice", "No guessing when to drop ingredients in, no flipping recipe books. Golden runs the sequence for you."],
];

const COMPARE = [
  ["Core architecture", "Library of disconnected recipe cards and videos", "Kitchen operating system with a live timeline"],
  ["When it goes wrong", "Failed attempts end up in the bin", "AI Doctor for real-time rescue"],
  ["Multi-dish cooking", "You juggle separate timers and recipes", "One unified timeline: heat, prep and plating"],
  ["Pantry", "Rigid lists and special grocery runs", "Pantry-to-Plate Matcher with substitutes"],
  ["Cuisine depth", "Surface-level beginner recipes", "Italian, Korean and Chinese technique modules"],
  ["Risk", "Non-refundable", "10 Perfect Dishes money-back guarantee"],
];

const FAQ = [
  ["What happens in the free 3-Day Zero-Waste Challenge?", "For three days you get the full Executive Chef System for free. Day 1: a 5-minute crisper-drawer audit. Day 2: three master sauces that tie random ingredients together. Day 3: a two-dish dinner, timed by the orchestrator, on the table in under 30 minutes. Cancel before day 3 ends and you pay nothing."],
  ["What's the difference between the two plans?", `The Golden Experience (${money(experience.price)}/year) gives you skill-adapted recipes and cook mode, one dish at a time. The Golden Executive Chef System (${money(executive.price)}/year) adds the Multi-Dish Timing Orchestrator, the Fix My Mistake AI Doctor, the Pantry-to-Plate Matcher, the cuisine modules and the money-back guarantee.`],
  ["Why is it 80% off?", `The founding price is for the first 5,000 members only, until the countdown ends. After that, the Executive Chef System is ${money(executive.regularPrice ?? executive.price)}/year. Founding members keep their price for as long as they stay subscribed.`],
  ["How does the money-back guarantee work?", `Cook ${GUARANTEE.dishes} full meals with Golden. If you don't get every dish on the table hot and on time, rescue at least one mistake with the AI Doctor, and see a real drop in your weekly food waste, send us your session log within ${GUARANTEE.days} days of purchase for a 100% refund.`],
  ["How do I cancel?", "Any time, in two taps, from your Whop account. Cancel during the free challenge and you're never charged."],
  ["Does it work on my phone?", "Yes. Golden runs on iPhone, Android and any computer browser, and cook mode keeps your screen awake while you cook."],
];

export default async function LandingPage() {
  const launch = await launchState();
  const pct = percentOff(executive);
  const endDate = new Date(launch.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const totalValue = VALUE_STACK.reduce((s, v) => s + v.value, 0);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-black font-sans text-white">
      {/* Floating pill navigation */}
      <header className="sticky top-3 z-40 px-3 sm:top-5 sm:px-6">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#0d0d0d]/80 py-2 pl-5 pr-2 backdrop-blur-xl sm:pl-7">
          <Link href="/" aria-label="Golden home"><Brand className="text-2xl text-white sm:text-3xl" /></Link>
          <div className="hidden items-center gap-8 text-[15px] text-white/60 lg:flex">
            {NAV.map(([label, href]) => <a key={href} href={href} className="transition hover:text-white">{label}</a>)}
          </div>
          <Link href="/signin" className="rounded-full bg-[#facc15] px-5 py-2.5 text-[15px] font-semibold text-black transition hover:bg-[#fde047] sm:px-6 sm:py-3">Try free</Link>
        </nav>
      </header>

      <main>
        {/* 1. Hero: the avatar, the 7 PM problem, the promise */}
        <section className="relative px-5 pb-16 pt-16 text-center sm:pt-24">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[36rem] max-w-4xl bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.18),transparent_65%)]" />
          <p className="relative mx-auto inline-flex rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70">
            {launch.open ? `Founding launch · ${pct}% off · ${launch.left.toLocaleString("en-US")} of ${launch.spots.toLocaleString("en-US")} spots left` : "The Golden Executive Chef System"}
          </p>
          <h1 className="relative mx-auto mt-6 max-w-5xl text-[2.9rem] font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.6rem]">
            It&apos;s 7:00 PM. Dinner, <span className="text-gold">on autopilot.</span>
          </h1>
          <p className="relative mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Golden is built for the exhausted professional or parent walking through the door at 7:00 PM who doesn&apos;t want to browse recipes. You want to know exactly how to turn three random leftovers into dinner, avoid burning them, and get the meat and the vegetables finished at the exact same moment, without panic.
          </p>
          <div className="relative mx-auto mt-9 flex max-w-xl flex-col gap-3 whitespace-nowrap sm:flex-row sm:justify-center">
            <Link href="/signin" className="rounded-full bg-[#facc15] px-8 py-4 text-lg font-semibold text-black transition hover:bg-[#fde047]">Start the free 3-day challenge</Link>
            <a href="#pricing" className="rounded-full border border-white/20 px-8 py-4 text-lg font-semibold transition hover:bg-white/10">See the offer</a>
          </div>
          <p className="relative mt-4 text-sm text-white/50">$0 today · cancel any time · iPhone, Android and web</p>

          <div className="relative mx-auto mt-16 flex max-w-5xl items-end justify-center gap-2">
            <div className="hidden translate-y-10 md:block"><Phone tilt="left"><PantryScreen /></Phone></div>
            <Phone tilt="none" className="z-10"><TimelineScreen /></Phone>
            <div className="hidden translate-y-10 md:block"><Phone tilt="right"><DoctorScreen /></Phone></div>
          </div>
        </section>

        {/* 2. The size of the problem */}
        <section id="problem" className="scroll-mt-28 px-5 py-20 sm:py-28">
          <p className="mx-auto max-w-4xl text-center text-3xl font-semibold leading-snug sm:text-5xl sm:leading-tight">
            <span className="bg-gradient-to-b from-white to-white/45 bg-clip-text text-transparent">
              Around $1,500 a year. That&apos;s roughly how much food the average family of four throws away, before a single takeout order. It&apos;s time to fight back.
            </span>
          </p>
          <p className="mt-4 text-center text-sm text-white/40">Estimate: USDA Economic Research Service.</p>

          <div className="mx-auto mt-16 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FRUSTRATIONS.map(([t, d]) => (
              <article key={t} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-white/60">{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 3. Who it's for */}
        <section className="px-5 py-16" aria-labelledby="avatars">
          <h2 id="avatars" className="mx-auto max-w-3xl text-center text-xl font-semibold leading-relaxed text-white/80 sm:text-2xl">
            Great food is essential to every part of life.<br />Find out how Golden fits yours.
          </h2>
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
            {AVATARS.map((a) => (
              <article key={a.title} className={`flex min-h-[22rem] flex-col justify-end rounded-[2.5rem] bg-gradient-to-b ${a.tint} p-7`}>
                <h3 className="text-2xl font-semibold">For {a.title.toLowerCase()}</h3>
                <p className="mt-3 text-white/60">{a.pain}</p>
                <p className="mt-4 border-t border-white/10 pt-4 font-medium text-[#fde68a]">{a.win}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Three pillars, alternating with phone screens */}
        <section id="system" className="scroll-mt-28 px-5 py-20" aria-labelledby="system-title">
          <h2 id="system-title" className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight sm:text-6xl">
            An operating system <span className="text-gold">for your kitchen</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-white/60">
            Ordinary recipes are static. Real kitchens aren&apos;t. Golden covers all three phases of cooking: before, during and at the plate.
          </p>
          <div className="mx-auto mt-20 max-w-6xl space-y-28">
            {PILLARS.map((p, i) => (
              <div key={p.tag} className={`flex flex-col items-center gap-14 md:flex-row ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-white/70"><p.Icon size={22} />{p.tag}</span>
                  <h3 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{p.title}</h3>
                  <p className="mt-2 text-lg font-semibold text-[#facc15]">{p.mechanism}</p>
                  <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/65">{p.text}</p>
                </div>
                <div className="flex-1"><Phone tilt={i % 2 ? "left" : "right"}>{p.screen}</Phone></div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Three burning pains */}
        <section className="px-5 py-20" aria-labelledby="pains">
          <h2 id="pains" className="text-center text-4xl font-bold tracking-tight sm:text-5xl">Three costs you pay <span className="text-gold">every week</span></h2>
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
            {PAINS.map((p) => (
              <article key={p.kind} className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-7">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#facc15]">{p.kind} pain</p>
                <p className="mt-3 text-lg text-white/70">{p.pain}</p>
                <div className="mt-6 rounded-2xl bg-[#facc15]/10 p-4">
                  <p className="font-semibold">Golden: {p.fix}</p>
                  <p className="mt-1 text-white/65">{p.how}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Feature → benefit, with value */}
        <section className="px-5 py-20" aria-labelledby="stack">
          <h2 id="stack" className="text-center text-4xl font-bold tracking-tight sm:text-5xl">Everything in the <span className="text-gold">Executive Chef System</span></h2>
          <div className="mx-auto mt-12 max-w-4xl divide-y divide-white/10 overflow-hidden rounded-[2rem] border border-white/10">
            {VALUE_STACK.map((v) => (
              <div key={v.name} className="flex flex-col gap-2 p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div>
                  <h3 className="text-lg font-semibold">{v.name}</h3>
                  <p className="mt-1 text-white/60">{v.benefit}</p>
                </div>
                <p className="shrink-0 text-white/50">Value <span className="font-semibold text-white">{money(v.value)}/yr</span></p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-[#facc15]/10 p-6 text-lg">
              <span className="font-semibold">Total value</span>
              <span><span className="mr-3 text-white/40 line-through">{money(totalValue)}/yr</span><span className="font-bold text-[#facc15]">{money(executive.price)}/yr founding price</span></span>
            </div>
          </div>
        </section>

        {/* 7. Value equation */}
        <section className="px-5 py-20" aria-labelledby="equation">
          <h2 id="equation" className="text-center text-4xl font-bold tracking-tight sm:text-5xl">More result. <span className="text-gold">Less of everything else.</span></h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
            {EQUATION.map(([t, d], i) => (
              <article key={t} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7">
                <p className="text-sm font-semibold uppercase tracking-widest text-white/40">{i < 2 ? "Maximized" : "Close to zero"}</p>
                <h3 className="mt-2 text-2xl font-semibold">{t}</h3>
                <p className="mt-2 text-white/60">{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 8. Milestones: chef ranks */}
        <section className="px-5 py-20" aria-labelledby="ranks">
          <h2 id="ranks" className="text-center text-4xl font-bold tracking-tight sm:text-6xl">Unlock golden milestones</h2>
          <p className="mt-4 text-center text-lg text-white/60">Every dish you cook earns XP, keeps your streak and takes you up the brigade.</p>
          <div className="mx-auto mt-12 flex max-w-6xl snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none]">
            {RANKS.map((r, i) => (
              <article key={r.title} className="flex min-w-[13rem] snap-start flex-col items-center rounded-[2rem] border border-white/10 px-5 py-8 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#facc15_40%,#a6761d_85%)] text-2xl font-black text-black/70 shadow-[0_0_40px_rgba(250,204,21,0.35)]" style={{ filter: `saturate(${0.5 + i * 0.12})` }}>{i + 1}</span>
                <h3 className="mt-5 text-lg font-semibold">{r.title}</h3>
                <p className="text-sm text-white/50">{r.xp} XP</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-6 text-white/60">
            <span className="flex items-center gap-2"><TrophyIcon size={26} /> XP</span>
            <span className="flex items-center gap-2"><FlameIcon size={26} /> Streaks</span>
            <span className="flex items-center gap-2"><SteamingDishIcon size={26} /> Kitchen log</span>
          </div>
        </section>

        {/* 9. Decoy vs Grand Slam */}
        <section className="px-5 py-20" aria-labelledby="contrast">
          <h2 id="contrast" className="text-center text-4xl font-bold tracking-tight sm:text-5xl">A recipe app vs. <span className="text-gold">a kitchen system</span></h2>
          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto rounded-[2rem] border border-white/10">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-white/[0.04] text-sm uppercase tracking-wide text-white/50">
                <tr><th className="p-5 font-semibold" scope="col"><span className="sr-only">Dimension</span></th><th className="p-5 font-semibold" scope="col">Typical cooking class or app</th><th className="p-5 font-semibold text-[#facc15]" scope="col">Golden Executive Chef System</th></tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {COMPARE.map(([d, them, us]) => (
                  <tr key={d}><th scope="row" className="p-5 font-semibold">{d}</th><td className="p-5 text-white/50">{them}</td><td className="p-5"><span className="mr-2 text-[#facc15]">✓</span>{us}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. Pricing: attraction, decoy, grand slam */}
        <section id="pricing" className="scroll-mt-28 px-5 py-20" aria-labelledby="pricing-title">
          <h2 id="pricing-title" className="text-center text-4xl font-bold tracking-tight sm:text-6xl">Choose how you <span className="text-gold">cook tonight</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/60">
            {perMonth(executive)} a month: less than a single takeout dinner, for a year of hot, on-time meals.
          </p>

          <div className="mx-auto mt-14 grid max-w-6xl items-start gap-5 lg:grid-cols-3">
            <PriceCard
              name={ATTRACTION.name}
              sub="Start here, free"
              price="$0"
              per=""
              note="Then pick a plan, or cancel"
              items={["Day 1: the 5-minute Crisper Drawer Audit", "Day 2: 3 master sauces for random ingredients", "Day 3: a two-dish dinner in under 30 minutes", "Full Executive features for all 3 days"]}
              cta="Start the challenge"
            />
            <PriceCard
              name={experience.name}
              sub="One dish at a time"
              price={money(experience.price)}
              per="/year"
              note={`${perMonth(experience)}/month, billed yearly`}
              items={experience.includes}
              missing={experience.excludes}
              cta="Choose Experience"
            />
            <PriceCard
              featured
              name={executive.name}
              sub="The complete kitchen system"
              price={money(executive.price)}
              was={executive.regularPrice ? money(executive.regularPrice) : undefined}
              per="/year"
              note={`${perMonth(executive)}/month · ${pct}% off for founding members`}
              items={executive.includes}
              cta="Claim my founding spot"
            />
          </div>

          {/* Scarcity: real spots count and a fixed end date */}
          <div className="mx-auto mt-14 max-w-3xl rounded-[2rem] border border-[#facc15]/30 bg-[#facc15]/[0.06] p-7 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#facc15]">Founding price ends {endDate}</p>
            <p className="mt-2 text-2xl font-semibold">
              {launch.taken.toLocaleString("en-US")} of {launch.spots.toLocaleString("en-US")} founding spots taken
            </p>
            <div className="mx-auto mt-4 h-3 max-w-lg overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={launch.spots} aria-valuenow={launch.taken} aria-label="Founding spots taken">
              <div className="h-full rounded-full bg-gradient-to-r from-[#a6761d] to-[#facc15]" style={{ width: `${Math.max(1, (launch.taken / launch.spots) * 100)}%` }} />
            </div>
            <div className="mt-6"><Countdown endsAt={launch.endsAt} /></div>
            <p className="mt-5 text-white/60">When the spots or the clock run out, the Executive Chef System goes back to {money(executive.regularPrice ?? executive.price)}/year. Founding members keep {money(executive.price)}/year for as long as they stay.</p>
          </div>
        </section>

        {/* 11. Risk reversal */}
        <section id="guarantee" className="scroll-mt-28 px-5 py-20" aria-labelledby="guarantee-title">
          <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-gradient-to-b from-[#2a2208] to-[#0c0a05] p-8 text-center sm:p-14">
            <span aria-hidden className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#facc15_45%,#a6761d)] text-4xl font-black text-black/75">10</span>
            <h2 id="guarantee-title" className="mt-6 text-3xl font-bold sm:text-5xl">The 10 Perfect Dishes <span className="text-gold">Money-Back Guarantee</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">We take on the risk. Cook {GUARANTEE.dishes} full meals with Golden. If you don&apos;t:</p>
            <ol className="mx-auto mt-6 max-w-xl space-y-3 text-left text-lg">
              {["Get every dish on the table on time, all of it hot,", "Rescue at least one mistake with the AI Doctor, and", "See a real drop in your weekly food waste,"].map((t, i) => (
                <li key={t} className="flex gap-3 rounded-2xl bg-white/5 p-4"><span className="font-bold text-[#facc15]">{i + 1}.</span>{t}</li>
              ))}
            </ol>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">send us your session log within {GUARANTEE.days} days of purchase and get a <strong className="text-white">100% refund</strong>. No friction, no hard feelings. You keep every guide and cheat sheet.</p>
            <Link href="/guarantee" className="mt-5 inline-block text-white/60 underline">Full guarantee terms</Link>
          </div>
        </section>

        {/* 12. FAQ */}
        <section id="faq" className="scroll-mt-28 px-5 py-20" aria-labelledby="faq-title">
          <h2 id="faq-title" className="bg-gradient-to-b from-white to-white/45 bg-clip-text text-center text-5xl font-bold text-transparent sm:text-7xl">FAQ</h2>
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
        </section>

        {/* 13. Final call to action */}
        <section className="px-5 pb-24 pt-10 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">On iPhone, Android <span className="text-gold">and the web</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">Better than another recipe app. Golden runs your kitchen, so dinner gets made and you get your evening back.</p>
          <Link href="/signin" className="mt-9 inline-block rounded-full bg-[#facc15] px-10 py-4 text-lg font-semibold text-black transition hover:bg-[#fde047]">Start free for {ATTRACTION.days} days</Link>
          <p className="mt-4 text-sm text-white/50">Already a member? <Link href="/signin" className="underline">Sign in</Link></p>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-10 text-sm text-white/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Brand className="text-xl text-white" />
          <div className="flex gap-6">
            <Link href="/guarantee" className="hover:text-white">Guarantee</Link>
            <Link href="/giveaway" className="hover:text-white">Giveaway rules</Link>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <p>© {new Date().getFullYear()} Golden</p>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({ name, sub, price, was, per, note, items, missing = [], cta, featured }: { name: string; sub: string; price: string; was?: string; per: string; note: string; items: string[]; missing?: string[]; cta: string; featured?: boolean }) {
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
      <ul className="mt-6 space-y-3">
        {items.map((i) => <li key={i} className="flex gap-3"><span aria-hidden className="text-[#facc15]">✓</span><span className="text-white/85">{i}</span></li>)}
        {missing.map((i) => <li key={i} className="flex gap-3 text-white/35"><span aria-hidden>✕</span><span className="line-through">{i}</span></li>)}
      </ul>
      <Link href="/signin" className={`mt-8 flex min-h-14 items-center justify-center rounded-full text-lg font-semibold transition ${featured ? "bg-[#facc15] text-black hover:bg-[#fde047]" : "border border-white/20 hover:bg-white/10"}`}>{cta}</Link>
    </article>
  );
}
