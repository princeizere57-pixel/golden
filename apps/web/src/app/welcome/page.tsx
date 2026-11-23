import type { Metadata } from "next";
import Link from "next/link";
import { FridgeIcon, LifebuoyIcon, StopwatchIcon } from "@/components/icons-3d";
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

function StartLinks() {
  return (
    <>
      <Link href="/signin" className="flex min-h-14 w-full items-center justify-center rounded-full bg-button px-8 text-lg font-semibold text-button-ink md:w-auto md:whitespace-nowrap">Start free: {TRIAL_HEADLINE_DAYS} days, $0 today</Link>
      <Link href="/signin" className="mt-2 flex min-h-11 w-full items-center justify-center text-base font-medium md:mt-0 md:w-auto md:whitespace-nowrap md:px-4">I already have an account</Link>
    </>
  );
}

export default function WelcomePage() {
  return (
    <main className="relative mx-auto min-h-dvh max-w-lg overflow-x-hidden bg-surface pb-40 md:max-w-none md:bg-transparent md:px-6 md:pb-16">
      <div className="md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:pt-12 lg:gap-20">
        <section className="pt-10 text-center md:pt-0 md:text-left">
          <Brand className="text-5xl" />
          <h1 className="mt-6 px-6 font-display text-[2.4rem] leading-[1.05] md:px-0 md:text-5xl lg:text-6xl">
            Never Waste <span className="text-accent">Groceries</span> Again.
          </h1>
          <p className="mt-5 px-6 text-[17px] text-muted md:max-w-xl md:px-0 md:text-xl">
            Golden turns your fridge into tonight&apos;s dinner before expensive ingredients spoil. It guides you from beginner to chef and times every dish to land hot together.
          </p>
          <div className="hidden md:mt-8 md:flex md:flex-wrap md:items-center md:gap-2"><StartLinks /></div>
        </section>

        <div className="mt-8 px-6 md:mt-0 md:px-0">
          <div className="mx-auto w-[230px] md:w-[260px] lg:w-[300px]"><Phone screen="discover" tilt="none" priority /></div>
        </div>
      </div>

      <section className="mt-10 bg-bg px-6 py-8 md:mt-16 md:rounded-3xl md:bg-surface md:p-10" aria-labelledby="gives-back">
        <h2 id="gives-back" className="font-display text-[1.9rem]">
          What Golden <span className="text-accent">gives back</span>
        </h2>
        <p className="mt-2 text-muted">A family of four throws away around $1,500 of food a year (USDA estimate). Here&apos;s where Golden stops it.</p>
        <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3 md:gap-4">
          {GIVES_BACK.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl bg-surface p-4 md:flex-col md:bg-bg md:p-6">
              <Icon size={40} className="shrink-0" />
              <p><strong>{title}.</strong> {text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] rounded-t-3xl bg-bg px-6 pb-6 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:hidden">
        <StartLinks />
      </div>
    </main>
  );
}
