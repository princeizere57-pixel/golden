import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FlameIcon, HatIcon, LifebuoyIcon, PanFireIcon, SteamingDishIcon, TrophyIcon } from "@/components/icons-3d";
import { AppShot, type Screen } from "@/components/landing/app-shot";
import { Countdown } from "@/components/landing/countdown";
import { Brand } from "@/components/site-chrome";
import { launchState } from "@/lib/billing/launch";
import { ATTRACTION, GUARANTEE, money, offerById, percentOff, perMonth } from "@/lib/billing/offers";
import { RANKS } from "@/lib/gamify";

// The Golden landing page (/landing), separate from the app. It uses the app's own design:
// white page, beige cards, orange highlight words, yellow pill buttons, Archivo headlines,
// Geist body text, and real screenshots of the app (public/landing).

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
  { title: "Ambitious professionals", pain: "You need real, nutrient-dense food to perform, but you don't have hours to plan, shop and babysit pans.", win: "Dinner planned from what you already have, cooked in under 35 hands-on minutes." },
  { title: "Busy parents", pain: "Different tastes, tight schedules and the nightly pressure to put something healthy on the table.", win: "One timeline for the whole family meal, so nothing burns while you help with homework." },
  { title: "Home cooking enthusiasts", pain: "You know the basics, but multi-course timing and hosting turn into stress at the stove.", win: "Restaurant-style pacing and technique modules, so you cook freely and stay with your guests." },
];

const FRUSTRATIONS = [
  ["Meal timing breakdown", "The steak goes cold while the potatoes finish. Courses arrive out of order."],
  ["Ingredient waste", "Forgotten produce rots in the crisper drawer. Another grocery run for one item."],
  ["Decision fatigue", "\"What's for dinner?\" Every single day, after a full day of decisions."],
  ["Multi-dish chaos", "Two burners, one oven, three dishes and no idea what goes first."],
];

const PILLARS: { tag: string; title: ReactNode; mechanism: string; text: string; screen: Screen; Icon: (p: { size?: number }) => ReactNode }[] = [
  {
    tag: "Pillar I · Prevention",
    title: <>Mistakes stopped <span className="text-accent">before they start</span></>,
    mechanism: "Skill-Adaptation Engine",
    text: "Every recipe recalibrates to your level: micro-steps and sensory cues for beginners, pro shorthand for confident cooks, technique and food science for chefs. Slide between levels mid-cook.",
    screen: "cook",
    Icon: HatIcon,
  },
  {
    tag: "Pillar II · Intervention",
    title: <>Your dish, <span className="text-accent">rescued</span> in seconds</>,
    mechanism: "'Fix My Mistake' AI Doctor",
    text: "Too salty, split, burnt or bland? Snap a photo or tap what you see. You get exact amounts for your pan, built on acid, fat, salt, sugar and heat, before dinner goes in the bin.",
    screen: "fix",
    Icon: LifebuoyIcon,
  },
  {
    tag: "Pillar III · Execution",
    title: <>Every dish lands <span className="text-accent">hot, together</span></>,
    mechanism: "Multi-Dish Timing Orchestrator",
    text: "Up to four recipes merge into one master timeline. Golden staggers every start, gives you one hands-on task at a time, and chimes and vibrates when it's time to switch.",
    screen: "timeline",
    Icon: PanFireIcon,
  },
];

const PAINS = [
  { kind: "Wealth", pain: "The average US family of four throws away around $1,500 of food a year, then pays again for takeout.", fix: "Pantry-to-Plate Optimization", how: "Turns what's already in your fridge into dinner and only lists what you're missing." },
  { kind: "Health", pain: "Ultra-processed meals, eating out, or two disconnected, exhausting hours at the stove every night.", fix: "Streamlined Execution Pathways", how: "Whole-food meals in under 35 minutes of hands-on time, one clear step at a time." },
  { kind: "Relationships", pain: "Hosting anxiety, cold food, and being stuck at the stove while everyone else is talking.", fix: "Synchronized Table Landing", how: "You control the clock, so you serve hot, multi-course meals and stay with your people." },
];

const VALUE_STACK = [
  { name: "Multi-Dish Synchronized Timing Orchestrator", benefit: "No more juggling oven temperatures, pan space and staging. Everything finishes hot at the same minute.", value: 150 },
  { name: "'Fix My Mistake' AI Doctor", benefit: "Rescues costly ingredients from the bin and removes the panic of a ruined dinner.", value: 120 },
  { name: "Pantry-to-Plate Matcher", benefit: "Answers \"what's for dinner?\" from your own fridge and gets more from every grocery trip.", value: 80 },
  { name: "Chinese, Korean & Italian Culinary Arts Modules", benefit: "Wok heat control, fermentation and balance, pan sauces and pasta texture: technique, not memorizing.", value: 100 },
  { name: "Skill-Adaptation Engine + hands-free cook mode", benefit: "Recipes rewritten for your level, with timers, chimes and a screen that stays on.", value: 50 },
];

const EQUATION = [
  ["Dream outcome", "Maximized", "Flawless multi-dish meals, far less food waste, restaurant-quality home cooking and real kitchen confidence."],
  ["Likelihood of success", "Maximized", "A timing engine, skill-adapted steps and an AI Doctor on standby. You're never cooking alone."],
  ["Time to results", "Close to zero", "Instant onboarding and your first planned meal within 15 minutes of signing up."],
  ["Effort and sacrifice", "Close to zero", "No guessing when to drop ingredients in, no flipping recipe books. Golden runs the sequence for you."],
];

const COMPARE = [
  ["Core architecture", "Disconnected recipe cards and videos", "Kitchen operating system with a live timeline"],
  ["When it goes wrong", "Failed attempts end up in the bin", "AI Doctor for real-time rescue"],
  ["Multi-dish cooking", "You juggle separate timers", "One unified timeline: heat, prep and plating"],
  ["Pantry", "Rigid lists and special grocery runs", "Pantry-to-Plate Matcher with substitutes"],
  ["Cuisine depth", "Surface-level beginner recipes", "Italian, Korean and Chinese technique modules"],
  ["Risk", "Non-refundable", "10 Perfect Dishes money-back guarantee"],
];

const FAQ = [
  ["What happens in the free 3-Day Zero-Waste Challenge?", "For three days you get the full Executive Chef System for free. Day 1: a 5-minute crisper-drawer audit. Day 2: three master sauces that tie random ingredients together. Day 3: a two-dish dinner, timed by the orchestrator, on the table in under 30 minutes. Cancel before day 3 ends and you pay nothing."],
  ["What's the difference between the two plans?", `The Golden Experience (${money(experience.price)}/year) gives you skill-adapted recipes and cook mode, one dish at a time. The Golden Executive Chef System (${money(executive.price)}/year) adds the Multi-Dish Timing Orchestrator, the Fix My Mistake AI Doctor, the Pantry-to-Plate Matcher, the cuisine modules and the money-back guarantee.`],
  ["Why is it 80% off?", `The founding price is for the first 5,000 members only, until the countdown ends. After that, the Executive Chef System is ${money(executive.regularPrice ?? executive.price)}/year. Founding members keep their price for as long as they stay subscribed.`],
  ["How does the money-back guarantee work?", `Cook ${GUARANTEE.dishes} full meals with Golden. If you don't get every dish on the table hot and on time, rescue at least one mistake with the AI Doctor, and see a real drop in your weekly food waste, send us your session log within ${GUARANTEE.days} days of purchase for a 100% refund.`],
  ["How do I cancel?", "Any time, from your Whop account. Cancel during the free challenge and you're never charged."],
  ["Does it work on my phone?", "Yes. Golden runs on iPhone, Android and any computer browser, and cook mode keeps your screen awake while you cook."],
];

const CTA = "flex min-h-14 items-center justify-center rounded-full bg-button px-8 text-lg font-semibold text-button-ink";
const H2 = "font-display text-[1.9rem]";

export default async function LandingPage() {
  const launch = await launchState();
  const pct = percentOff(executive);
  const endDate = new Date(launch.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const totalValue = VALUE_STACK.reduce((s, v) => s + v.value, 0);
  const spots = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-ink">
      {/* Navigation, like the app's top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/landing" aria-label="Golden home"><Brand className="text-3xl" /></Link>
          <div className="hidden items-center gap-6 font-medium text-muted md:flex">
            {NAV.map(([label, href]) => <a key={href} href={href} className="hover:text-ink">{label}</a>)}
          </div>
          <Link href="/signin" className="flex min-h-11 items-center rounded-full bg-button px-5 font-semibold text-button-ink">Try free</Link>
        </nav>
      </header>

      <main>
        {/* 1. Hero: the avatar, the 7 PM problem, the promise */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-12 pt-8 md:grid-cols-[1.15fr_1fr] md:pt-14">
          <div>
            <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-ink">
              {launch.open ? `Founding launch · ${pct}% off · ${spots(launch.left)} of ${spots(launch.spots)} spots left` : "The Golden Executive Chef System"}
            </p>
            <h1 className="mt-4 font-display text-[2.45rem]">
              It&apos;s 7:00 PM. Dinner, <span className="text-accent">on autopilot</span>
            </h1>
            <p className="mt-4 text-[17px] text-muted">
              Golden is built for the exhausted professional or parent walking through the door at 7:00 PM who doesn&apos;t want to browse recipes. You want to know exactly how to turn three random leftovers into dinner, avoid burning them, and get the meat and the vegetables finished at the exact same moment, without panic.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/signin" className={CTA}>Start the free 3-day challenge</Link>
              <a href="#pricing" className="flex min-h-14 items-center justify-center rounded-full border-2 border-line px-8 text-lg font-semibold">See the offer</a>
            </div>
            <p className="mt-3 text-sm text-muted">$0 today · cancel any time · iPhone, Android and web</p>
          </div>
          <div className="relative flex justify-center">
            <AppShot screen="discover" tilt={-6} className="absolute -left-2 top-10 hidden opacity-95 lg:block" />
            <AppShot screen="plan" tilt={4} priority className="relative lg:translate-x-16" />
          </div>
        </section>

        {/* 2. The size of the problem */}
        <section id="problem" className="scroll-mt-20 bg-surface px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className={`${H2} max-w-3xl`}>
              Around <span className="text-accent">$1,500 a year</span>. That&apos;s roughly what the average family of four throws away in food, before a single takeout order.
            </h2>
            <p className="mt-2 text-sm text-muted">Estimate: USDA Economic Research Service.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FRUSTRATIONS.map(([t, d]) => (
                <article key={t} className="rounded-3xl border border-line bg-bg p-5">
                  <h3 className="text-lg font-semibold leading-tight">{t}</h3>
                  <p className="mt-2 text-muted">{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Who it's for */}
        <section className="mx-auto max-w-5xl px-4 py-14" aria-labelledby="avatars">
          <h2 id="avatars" className={H2}>Built for <span className="text-accent">your</span> evenings</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {AVATARS.map((a) => (
              <article key={a.title} className="rounded-3xl border border-line p-5">
                <h3 className="text-lg font-semibold">For {a.title.toLowerCase()}</h3>
                <p className="mt-2 text-muted">{a.pain}</p>
                <p className="mt-3 rounded-2xl bg-accent-soft p-3"><strong>Golden:</strong> {a.win}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Three pillars beside real app screens */}
        <section id="system" className="scroll-mt-20 bg-surface px-4 py-14" aria-labelledby="system-title">
          <div className="mx-auto max-w-5xl">
            <h2 id="system-title" className={H2}>An operating system <span className="text-accent">for your kitchen</span></h2>
            <p className="mt-2 max-w-2xl text-[17px] text-muted">Ordinary recipes are static. Real kitchens aren&apos;t. Golden covers all three phases of cooking: before, during and at the plate.</p>
            <div className="mt-10 space-y-14">
              {PILLARS.map((p, i) => (
                <div key={p.tag} className={`flex flex-col items-center gap-8 md:flex-row ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-2 rounded-full bg-bg px-3 py-1.5 text-sm font-semibold"><p.Icon size={24} />{p.tag}</span>
                    <h3 className="mt-3 font-display text-[1.7rem]">{p.title}</h3>
                    <p className="mt-1 font-semibold text-accent">{p.mechanism}</p>
                    <p className="mt-2 max-w-md text-[17px] text-muted">{p.text}</p>
                  </div>
                  <div className="flex-1"><AppShot screen={p.screen} tilt={i % 2 ? -3 : 3} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Three burning pains */}
        <section className="mx-auto max-w-5xl px-4 py-14" aria-labelledby="pains">
          <h2 id="pains" className={H2}>Three costs you pay <span className="text-accent">every week</span></h2>
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {PAINS.map((p) => (
              <article key={p.kind} className="rounded-3xl border border-line p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted">{p.kind} pain</p>
                <p className="mt-2">{p.pain}</p>
                <p className="mt-3 rounded-2xl bg-accent-soft p-3"><strong>{p.fix}:</strong> {p.how}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Feature → benefit, with value */}
        <section className="mx-auto max-w-5xl px-4 pb-14" aria-labelledby="stack">
          <h2 id="stack" className={H2}>Everything in the <span className="text-accent">Executive Chef System</span></h2>
          <div className="mt-6 overflow-hidden rounded-3xl border border-line">
            {VALUE_STACK.map((v) => (
              <div key={v.name} className="flex flex-col gap-1 border-b border-line p-5 sm:flex-row sm:justify-between sm:gap-6">
                <div>
                  <h3 className="font-semibold">{v.name}</h3>
                  <p className="mt-1 text-muted">{v.benefit}</p>
                </div>
                <p className="shrink-0 text-sm text-muted">Value <strong className="text-ink">{money(v.value)}/yr</strong></p>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface p-5 text-lg">
              <span className="font-semibold">Total value</span>
              <span><span className="mr-2 text-muted line-through">{money(totalValue)}/yr</span><strong>{money(executive.price)}/yr founding price</strong></span>
            </div>
          </div>
        </section>

        {/* 7. Value equation */}
        <section className="bg-surface px-4 py-14" aria-labelledby="equation">
          <div className="mx-auto max-w-5xl">
            <h2 id="equation" className={H2}>More result. <span className="text-accent">Less of everything else.</span></h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {EQUATION.map(([t, k, d]) => (
                <article key={t} className="rounded-3xl bg-bg p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted">{k}</p>
                  <h3 className="mt-1 text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-muted">{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Milestones: chef ranks, beside the real For you screen */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-2" aria-labelledby="ranks">
          <div>
            <h2 id="ranks" className={H2}>Unlock <span className="text-accent">golden</span> milestones</h2>
            <p className="mt-2 text-[17px] text-muted">Every dish you cook earns XP, keeps your streak and takes you up the brigade, with Mini You cheering you on.</p>
            <ol className="mt-5 space-y-2">
              {RANKS.map((r, i) => (
                <li key={r.title} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-button font-bold text-button-ink">{i + 1}</span>
                  <span className="flex-1 font-semibold">{r.title}</span>
                  <span className="text-sm text-muted">{r.xp} XP</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-5 text-muted">
              <span className="flex items-center gap-1.5"><TrophyIcon size={26} /> XP</span>
              <span className="flex items-center gap-1.5"><FlameIcon size={26} /> Streaks</span>
              <span className="flex items-center gap-1.5"><SteamingDishIcon size={26} /> Kitchen log</span>
            </div>
          </div>
          <AppShot screen="foryou" tilt={3} />
        </section>

        {/* 9. A recipe app vs the Golden system */}
        <section className="mx-auto max-w-5xl px-4 pb-14" aria-labelledby="contrast">
          <h2 id="contrast" className={H2}>Why Golden, not <span className="text-accent">another recipe app</span></h2>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-line">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-muted">
                <tr><th scope="col" className="px-4 py-3"><span className="sr-only">Dimension</span></th><th scope="col" className="px-4 py-3">Typical class or app</th><th scope="col" className="px-4 py-3 text-ink">Golden Executive Chef System</th></tr>
              </thead>
              <tbody>
                {COMPARE.map(([d, them, us]) => (
                  <tr key={d} className="border-t border-line"><th scope="row" className="px-4 py-3 font-semibold">{d}</th><td className="px-4 py-3 text-muted">{them}</td><td className="px-4 py-3"><span aria-hidden className="mr-1.5 text-basil">✓</span>{us}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. Pricing: attraction, decoy, grand slam */}
        <section id="pricing" className="scroll-mt-20 bg-surface px-4 py-14" aria-labelledby="pricing-title">
          <div className="mx-auto max-w-5xl">
            <h2 id="pricing-title" className={H2}>Choose how you <span className="text-accent">cook tonight</span></h2>
            <p className="mt-2 text-[17px] text-muted">{perMonth(executive)} a month: less than a single takeout dinner, for a year of hot, on-time meals.</p>
            <div className="mt-8 grid items-start gap-4 lg:grid-cols-3">
              <PriceCard name={ATTRACTION.name} sub="Start here, free" price="$0" per="" note="Then pick a plan, or cancel" items={["Day 1: the 5-minute Crisper Drawer Audit", "Day 2: 3 master sauces for random ingredients", "Day 3: a two-dish dinner in under 30 minutes", "Full Executive features for all 3 days"]} cta="Start the challenge" />
              <PriceCard name={experience.name} sub="One dish at a time" price={money(experience.price)} per="/year" note={`${perMonth(experience)}/month, billed yearly`} items={experience.includes} missing={experience.excludes} cta="Choose Experience" />
              <PriceCard featured name={executive.name} sub="The complete kitchen system" price={money(executive.price)} was={executive.regularPrice ? money(executive.regularPrice) : undefined} per="/year" note={`${perMonth(executive)}/month · ${pct}% off for founding members`} items={executive.includes} cta="Claim my founding spot" />
            </div>

            {/* Scarcity: real spots count and a fixed end date */}
            <div className="mt-8 rounded-3xl bg-charcoal p-6 text-center text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#facc15]">Founding price ends {endDate}</p>
              <p className="mt-1 text-xl font-bold">{spots(launch.taken)} of {spots(launch.spots)} founding spots taken</p>
              <div className="mx-auto mt-3 h-3 max-w-md overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={launch.spots} aria-valuenow={launch.taken} aria-label="Founding spots taken">
                <div className="h-full rounded-full bg-[#facc15]" style={{ width: `${Math.max(1, (launch.taken / launch.spots) * 100)}%` }} />
              </div>
              <div className="mt-5 text-ink"><Countdown endsAt={launch.endsAt} /></div>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/80">When the spots or the clock run out, the Executive Chef System goes back to {money(executive.regularPrice ?? executive.price)}/year. Founding members keep {money(executive.price)}/year for as long as they stay.</p>
            </div>
          </div>
        </section>

        {/* 11. Risk reversal */}
        <section id="guarantee" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14" aria-labelledby="guarantee-title">
          <div className="rounded-3xl border-4 border-button p-6 text-center">
            <div className="flex justify-center"><LifebuoyIcon size={56} /></div>
            <h2 id="guarantee-title" className={`${H2} mt-3`}>The 10 Perfect Dishes <span className="text-accent">Money-Back Guarantee</span></h2>
            <p className="mt-3 text-[17px] text-muted">We take on the risk. Cook {GUARANTEE.dishes} full meals with Golden. If you don&apos;t:</p>
            <ol className="mt-4 space-y-2 text-left">
              {["Get every dish on the table on time, all of it hot,", "Rescue at least one mistake with the AI Doctor, and", "See a real drop in your weekly food waste,"].map((t, i) => (
                <li key={t} className="flex gap-3 rounded-2xl bg-surface p-4"><strong>{i + 1}.</strong>{t}</li>
              ))}
            </ol>
            <p className="mt-4 text-[17px] text-muted">send us your session log within {GUARANTEE.days} days of purchase for a <strong className="text-ink">100% refund</strong>. No friction, no hard feelings. You keep every guide and cheat sheet.</p>
            <Link href="/guarantee" className="mt-3 inline-block text-sm underline">Full guarantee terms</Link>
          </div>
        </section>

        {/* 12. FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-14" aria-labelledby="faq-title">
          <h2 id="faq-title" className={H2}>FAQ</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-3xl border border-line px-5 py-4 open:bg-surface">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-2xl font-light transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 13. Final call to action */}
        <section className="bg-surface px-4 py-14 text-center">
          <Brand className="text-5xl" />
          <h2 className={`${H2} mx-auto mt-4 max-w-xl`}>On iPhone, Android <span className="text-accent">and the web</span></h2>
          <p className="mx-auto mt-2 max-w-md text-[17px] text-muted">Golden runs your kitchen, so dinner gets made and you get your evening back.</p>
          <Link href="/signin" className={`${CTA} mx-auto mt-6 max-w-sm`}>Start free for {ATTRACTION.days} days</Link>
          <Link href="/signin" className="mt-2 inline-flex min-h-11 items-center font-medium">I already have an account</Link>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <Brand className="text-xl" />
          <div className="flex gap-5">
            <Link href="/guarantee" className="hover:text-ink">Guarantee</Link>
            <Link href="/giveaway" className="hover:text-ink">Giveaway rules</Link>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <p>© {new Date().getFullYear()} Golden</p>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({ name, sub, price, was, per, note, items, missing = [], cta, featured }: { name: string; sub: string; price: string; was?: string; per: string; note: string; items: string[]; missing?: string[]; cta: string; featured?: boolean }) {
  return (
    <article className={`relative rounded-3xl bg-bg p-5 ${featured ? "border-4 border-button shadow-xl lg:-mt-4" : "border border-line"}`}>
      {featured && <span className="absolute -top-3 right-4 rounded-full bg-button px-3 py-0.5 text-xs font-bold text-button-ink">Best value · 80% off</span>}
      <h3 className="text-lg font-semibold leading-tight">{name}</h3>
      <p className="text-sm text-muted">{sub}</p>
      <p className="mt-4 flex items-end gap-2">
        {was && <span className="pb-1 text-xl text-muted line-through">{was}</span>}
        <span className="font-display text-[2.45rem] leading-none">{price}</span>
        <span className="pb-1 font-semibold">{per}</span>
      </p>
      <p className="mt-2 text-sm text-muted">{note}</p>
      <ul className="mt-4 space-y-2 border-t border-line pt-4">
        {items.map((i) => <li key={i} className="flex gap-2"><span aria-hidden className="text-basil">✓</span><span>{i}</span></li>)}
        {missing.map((i) => <li key={i} className="flex gap-2 text-muted"><span aria-hidden>✕</span><span className="line-through">{i}</span></li>)}
      </ul>
      <Link href="/signin" className={`mt-5 flex min-h-14 items-center justify-center rounded-full text-lg font-semibold ${featured ? "bg-button text-button-ink" : "border-2 border-line"}`}>{cta}</Link>
    </article>
  );
}
