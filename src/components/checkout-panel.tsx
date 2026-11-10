"use client";

// Checkout, in the order a buyer needs it: what they get at their level,
// the plans and upgrades, Whop's embedded payment, then the free giveaway entry + referral link.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition } from "react";
import { startCheckout, type StartCheckout } from "@/app/actions/checkout";
import { enterGiveaway, type EntryResult } from "@/app/actions/giveaway";
import { finishJourney, setDemoPlan } from "@/app/actions/viewer";
import { MiniYou } from "@/components/mini-you";
import { track } from "@/lib/analytics";

const WhopEmbed = dynamic(() => import("@/components/whop-embed").then((m) => m.WhopEmbed), { ssr: false });

export interface OfferView {
  id: string;
  name: string;
  tagline: string;
  priceLine: string;
  kind: "core" | "upsell";
  badge?: string;
  includes: string[];
  embedReady: boolean;
  planType: "renewal" | "one_time";
}

interface Props {
  user: { name: string; email: string };
  level: string;
  premium: boolean;
  offers: OfferView[];
  payLaterReady: boolean;
  drawDate: string;
  benefits: string[];
}

export function CheckoutPanel({ user, level, premium, offers, payLaterReady, drawDate, benefits }: Props) {
  const [chosen, setChosen] = useState("year");
  const [payLater, setPayLater] = useState(false);
  const [session, setSession] = useState<Extract<StartCheckout, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<EntryResult | null>(null);
  const [pending, startTransition] = useTransition();
  const offer = offers.find((o) => o.id === chosen)!;
  const firstName = user.name.split(" ")[0];

  if (premium) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <MiniYou size={150} mood="proud" />
        <h1 className="mt-4 font-display text-[2rem]">You&apos;re on <span className="text-accent">Premium</span></h1>
        <p className="mt-2 text-muted">Everything is unlocked for {user.email}.</p>
        <form action={finishJourney} className="mt-8 w-full">
          <button className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Back to my recipes</button>
        </form>
      </main>
    );
  }

  function pay() {
    setError(null);
    track("checkout_started", { provider: "whop", offer: chosen, pay_later: payLater });
    startTransition(async () => {
      const r = await startCheckout(chosen, payLater, window.location.origin);
      if (r.ok) setSession(r);
      else setError(r.error);
    });
  }

  function join() {
    startTransition(async () => setEntry(await enterGiveaway()));
  }

  const shareUrl = entry?.ok ? `${window.location.origin}/?ref=${entry.code}` : "";

  return (
    <main className="mx-auto max-w-lg px-5 pb-10 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/onboarding" aria-label="Back to your answers" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
        </Link>
        <span className="text-sm text-muted">Signed in as {user.email}</span>
      </div>

      {/* 1. The value, for their level */}
      <div className="mt-3 flex items-center gap-4">
        <MiniYou headOnly size={64} mood="happy" />
        <h1 className="font-display text-[1.9rem]">
          {firstName}, your <span className="text-accent">{level}</span> path is ready
        </h1>
      </div>
      <p className="mt-3 text-muted">Every dinner you rescue from the bin is money back in your pocket. Here&apos;s what you unlock:</p>
      <ul className="mt-3 space-y-2">
        {benefits.map((b) => (
          <li key={b} className="flex gap-2"><span aria-hidden className="text-basil">✓</span>{b}</li>
        ))}
      </ul>

      {/* 2. Attraction offer */}

      {/* 3. Plans and upgrades */}
      <fieldset className="mt-7 space-y-3" disabled={Boolean(session)}>
        <legend className="mb-1 text-lg font-semibold">Choose your plan</legend>
        {offers.filter((o) => o.kind === "core").map((o) => <OfferCard key={o.id} offer={o} checked={chosen === o.id} onChange={() => setChosen(o.id)} />)}
        {offers.some((o) => o.kind === "upsell") && (
          <>
            <p className="pt-3 text-lg font-semibold">Or go further</p>
            {offers.filter((o) => o.kind === "upsell").map((o) => <OfferCard key={o.id} offer={o} checked={chosen === o.id} onChange={() => setChosen(o.id)} />)}
          </>
        )}
      </fieldset>

      {payLaterReady && !session && (
        <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line px-4">
          <input type="checkbox" checked={payLater} onChange={(e) => setPayLater(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
          <span><strong>Buy now, pay later</strong><span className="block text-sm text-muted">Klarna, Afterpay/Clearpay, Affirm, Sezzle, Zip or instalments where available</span></span>
        </label>
      )}

      {/* 4. Payment */}
      <section className="mt-6" aria-label="Payment">
        {session ? (
          <div className="rounded-3xl border border-line p-3">
            <WhopEmbed plan={session.plan} checkoutConfiguration={session.checkoutConfiguration} metadata={session.metadata} returnUrl={session.returnUrl} offer={chosen} />
            <button onClick={() => setSession(null)} className="mt-2 min-h-11 w-full text-sm font-medium">Change plan</button>
          </div>
        ) : offer.embedReady ? (
          <button onClick={pay} disabled={pending} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-60">
            {pending ? "Preparing secure checkout…" : `Continue: ${offer.priceLine}`}
          </button>
        ) : offer.planType === "renewal" ? (
          <form action={setDemoPlan.bind(null, "premium")}>
            <button className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Start my free trial (demo)</button>
            <p className="mt-2 text-center text-xs text-muted">Demo mode: add your Whop plan IDs to take real payments.</p>
          </form>
        ) : (
          <p className="rounded-2xl bg-surface p-4 text-sm text-muted">This upgrade goes live once its Whop plan is set up.</p>
        )}
        {error && <p role="alert" className="mt-2 text-center text-sm text-tomato">{error}</p>}
        <p className="mt-3 text-center text-xs text-muted">Secure payment by Whop. Cancel any time before your trial ends and you won&apos;t be charged.</p>
      </section>

      <section className="mt-7 rounded-3xl bg-charcoal p-5 text-white" aria-labelledby="ga">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#facc15]">Free bonus: The Golden Giveaway</p>
        <h2 id="ga" className="mt-1 text-xl font-bold">Win a free year, and one for the friend who invited you</h2>
        <p className="mt-1 text-sm text-white/80">Free to enter, no purchase needed. Draw on {drawDate}. <Link href="/giveaway" className="underline">Rules</Link></p>
        {entry?.ok ? (
          <div className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">
            <p>You&apos;re in! Share your link. If a friend who joins through it wins, you win a year too.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={shareUrl} className="min-h-11 flex-1 rounded-xl bg-white px-3 text-ink" aria-label="Your referral link" onFocus={(e) => e.currentTarget.select()} />
              <button
                onClick={() => (navigator.share ? navigator.share({ title: "Golden", text: "Learn to cook at your level with Golden", url: shareUrl }).catch(() => {}) : navigator.clipboard.writeText(shareUrl))}
                className="min-h-11 rounded-xl bg-[#facc15] px-4 font-semibold text-[#1f1d1b]"
              >
                Share
              </button>
            </div>
            <p className="mt-2 text-white/70">{entry.referrals} friend{entry.referrals === 1 ? "" : "s"} joined through your link.</p>
          </div>
        ) : (
          <>
            <button onClick={join} disabled={pending} className="mt-3 min-h-12 w-full rounded-full bg-[#facc15] font-semibold text-[#1f1d1b] disabled:opacity-60">Enter the giveaway</button>
            {entry && !entry.ok && <p className="mt-2 text-sm text-white/80" role="alert">{entry.error}</p>}
          </>
        )}
      </section>

      <form action={finishJourney}>
        <button className="mt-4 flex min-h-12 w-full items-center justify-center font-medium">Not now, take me to my recipes</button>
      </form>
    </main>
  );
}

function OfferCard({ offer, checked, onChange }: { offer: OfferView; checked: boolean; onChange: () => void }) {
  return (
    <label className={`relative block cursor-pointer rounded-2xl border-2 px-4 py-3 ${checked ? "border-accent bg-accent-soft" : "border-line"}`}>
      <input type="radio" name="offer" checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-center gap-3">
        <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-accent" : "border-line"}`}>
          {checked && <span className="h-3 w-3 rounded-full bg-accent" />}
        </span>
        <span className="flex-1">
          <span className="block font-semibold">{offer.name}</span>
          <span className="block text-sm text-muted">{offer.tagline}</span>
        </span>
      </span>
      <span className="mt-1 block pl-9 text-sm font-bold">{offer.priceLine}</span>
      {checked && offer.kind === "upsell" && (
        <ul className="mt-2 space-y-1 pl-9 text-sm">{offer.includes.map((i) => <li key={i}>✓ {i}</li>)}</ul>
      )}
      {offer.badge && <span className="absolute -top-2.5 right-4 rounded-full bg-button px-2.5 py-0.5 text-xs font-bold text-button-ink">{offer.badge}</span>}
    </label>
  );
}
