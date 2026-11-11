import type { Metadata } from "next";
import Link from "next/link";
import { FridgeIcon, LifebuoyIcon, StopwatchIcon } from "@/components/icons-3d";
import { HeadlineTicker } from "@/components/headline-ticker";
import { Phone } from "@/components/landing/phone";
import { Brand } from "@/components/site-chrome";
import { TRIAL_HEADLINE_DAYS } from "@/lib/billing/offers";

export const metadata: Metadata = { title: "Welcome" };

/** What bad dinners cost, said about the person reading, and what Golden changes. */
const GIVES_BACK = [
  { Icon: FridgeIcon, title: "Your money", text: "Stop binning food you paid for. Golden turns what's in your fridge into dinner and rescues the expensive cut before it's ruined." },
  { Icon: StopwatchIcon, title: "Your time", text: "No 7 PM \"what's for dinner?\". One pick for tonight, written for your level, ready in about 30 minutes." },
  { Icon: LifebuoyIcon, title: "Your meals", text: "Every dish comes out right and lands hot together, instead of cold, overcooked or in the bin." },
];

/** One real moment per promise: food you paid for, a calm evening, the meal itself. */
const GIVES_BACK_PHOTOS = [
  { src: "/photos/counter-groceries.webp", alt: "Tomatoes, eggs and fresh bread on a kitchen counter" },
  { src: "/photos/steaming-pot.webp", alt: "A pot steaming gently by a sunny window" },
  { src: "/photos/salmon-bowl.webp", alt: "A plate of salmon, green beans and herby couscous" },
];

export default function WelcomePage() {
  return (
    <main className="relative mx-auto min-h-dvh max-w-lg overflow-x-hidden bg-surface pb-40">
      <section className="pt-10 text-center">
        <Brand className="text-5xl" />
        <HeadlineTicker className="mt-6" />
        <p className="mt-5 px-6 text-[17px] text-muted">
          You pay for food twice: at the shop, and again when it ends up in the bin. Golden helps you cook what you already have, save the dish when it goes wrong, and get dinner on the table hot.
        </p>
      </section>

      <div className="mt-8 px-6">
        <div className="mx-auto w-[230px]"><Phone screen="discover" tilt="none" priority /></div>
      </div>

      <section className="mt-10 bg-bg px-6 py-8" aria-labelledby="gives-back">
        <h2 id="gives-back" className="font-display text-[1.9rem]">
          What Golden <span className="text-accent">gives back</span>
        </h2>
        <p className="mt-2 text-muted">A family of four throws away around $1,500 of food a year (USDA estimate). Here&apos;s where Golden stops it.</p>
        <div className="mt-4 grid gap-3">
          {GIVES_BACK.map(({ title, text }, i) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- Golden's own photo */}
              <img src={GIVES_BACK_PHOTOS[i].src} alt={GIVES_BACK_PHOTOS[i].alt} loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              <p><strong>{title}.</strong> {text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] rounded-t-3xl bg-bg px-6 pb-6 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <Link href="/signin" className="flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Start free: {TRIAL_HEADLINE_DAYS} days, $0 today</Link>
        <Link href="/signin" className="mt-2 flex min-h-11 w-full items-center justify-center text-base font-medium">I already have an account</Link>
      </div>
    </main>
  );
}
