"use client";

// Checkout, in the order a buyer needs it: what they get at their level, the attraction offer
// (with the real founding countdown), the plans and upgrades, then Whop's embedded payment.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { startCheckout, type StartCheckout } from "@/app/actions/checkout";
import { Countdown } from "@/components/landing/countdown";
import { finishJourney, setDemoPlan } from "@/app/actions/viewer";
import { MiniYou } from "@/components/mini-you";
import { TrialTimeline } from "@/components/trial-timeline";
import { ATTRACTION } from "@/lib/billing/offers";
import { PlayCheckout } from "@/components/play-checkout";
import { Capacitor } from "@capacitor/core";
import { TIER_NAME, type Tier } from "@/lib/billing/entitlements";
import type { OfferId } from "@/lib/billing/offers";
import type { Store } from "@/lib/native/user-agent";
import { track } from "@/lib/analytics";

const WhopEmbed = dynamic(() => import("@/components/whop-embed").then((m) => m.WhopEmbed), { ssr: false });

export interface OfferView {
  id: string;
  name: string;
  tagline: string;
  priceLine: string;
  regularPrice?: string;
  kind: "core" | "upsell";
  badge?: string;
  includes: string[];
  excludes: string[];
  embedReady: boolean;
  planType: "renewal" | "one_time";
}

interface Props {
  user: { id: string; name: string; email: string };
  /** Demo payments allowed (no real accounts or payments configured): shows the pretend trial button. */
  demo?: boolean;
  level: string;
  /** The plan they already have: Executive sees "you're all set", Experience sees the upgrade. */
  tier: Tier;
  /** How this screen may take payment (server's guess from the app's user agent). */
  store: Store;
  offers: OfferView[];
  defaultOffer: string;
  launch: { left: number; spots: number; endsOn: string; endsAt: string; open: boolean };
  payLaterReady: boolean;
  benefits: string[];
}

export function CheckoutPanel({ user, level, tier, store: serverStore, offers, defaultOffer, launch, payLaterReady, benefits, demo = false }: Props) {
  const [chosen, setChosen] = useState(defaultOffer);
  const [payLater, setPayLater] = useState(false);
  const [session, setSession] = useState<Extract<StartCheckout, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const offer = offers.find((o) => o.id === chosen)!;
  const firstName = user.name.split(" ")[0];
  // Inside the Android app Google Play is the merchant of record, and inside the iPhone app Apple
  // would be: web payment (Whop) is never shown in either. The server already decided from the
  // user agent; the native bridge confirms it (older app builds), and until then no payment
  // button renders, so Whop can't flash up inside an app.
  const [store, setStore] = useState<Store | null>(serverStore === "web" ? null : serverStore);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) setStore(Capacitor.getPlatform() === "android" ? "google_play" : "none");
    else setStore(serverStore);
  }, [serverStore]);
  const android = store === "google_play";

  // Warm Whop up while the buyer reads: fetch the form's code and Whop's script now, not after "Continue".
  useEffect(() => {
    if (store === "web") void import("@/components/whop-embed").then((m) => m.warmWhop());
  }, [store]);

  if (tier === "executive") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <MiniYou size={150} mood="proud" />
        <h1 className="mt-4 font-display text-[2rem]">You&apos;re on <span className="text-accent">Executive</span></h1>
        <p className="mt-2 text-muted">{TIER_NAME.executive}: everything is unlocked for {user.email}.</p>
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
      {tier === "experience" && (
        <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm">You&apos;re on <strong>{TIER_NAME.experience}</strong>. Upgrade to cook several dishes at once, rescue mistakes and cook from your fridge.</p>
      )}
      <p className="mt-3 text-muted">Every dinner you rescue from the bin is money back in your pocket. Here&apos;s what you unlock:</p>
      <ul className="mt-3 space-y-2">
        {benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <span aria-hidden className="text-basil">✓</span>
            <BenefitText text={b} />
          </li>
        ))}
      </ul>

      {/* 2. Attraction offer */}

      {/* 3. Plans and upgrades */}
      {launch.open && (
        <p className="mt-7 rounded-2xl border-2 border-button bg-[#fef9c3] p-3 text-center text-sm font-semibold">
          Founding price: 80% off the Executive Chef System. {launch.left.toLocaleString("en-US")} of {launch.spots.toLocaleString("en-US")} spots left.
          <span className="mt-1 block">Ends {launch.endsOn}, in <Countdown endsAt={launch.endsAt} compact /></span>
        </p>
      )}
      <fieldset className="mt-4 space-y-3" disabled={Boolean(session)}>
        <legend className="mb-1 text-lg font-semibold">Start your free {ATTRACTION.name}, then</legend>
        <p className="-mt-1 mb-2 text-sm text-muted">For {ATTRACTION.days} days you get every feature, whichever plan you pick. Your plan starts after that.</p>
        {offers.filter((o) => o.kind === "core").map((o) => <OfferCard key={o.id} offer={o} checked={chosen === o.id} onChange={() => setChosen(o.id)} />)}
        {offers.some((o) => o.kind === "upsell") && (
          <>
            <p className="pt-3 text-lg font-semibold">Or go further</p>
            {offers.filter((o) => o.kind === "upsell").map((o) => <OfferCard key={o.id} offer={o} checked={chosen === o.id} onChange={() => setChosen(o.id)} />)}
          </>
        )}
      </fieldset>

      {payLaterReady && !session && store === "web" && (
        <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line px-4">
          <input type="checkbox" checked={payLater} onChange={(e) => setPayLater(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
          <span><strong>Buy now, pay later</strong><span className="block text-sm text-muted">Klarna, Afterpay/Clearpay, Affirm, Sezzle, Zip or instalments where available</span></span>
        </label>
      )}

      {/* Transparency: exactly what happens and when, before anyone pays */}
      <section className="mt-6 rounded-3xl border border-line p-5" aria-labelledby="free-days">
        <h2 id="free-days" className="font-semibold">How your free days work</h2>
        <div className="mt-4"><TrialTimeline days={ATTRACTION.days} price={offer.priceLine.replace(/^.*then /, "")} /></div>
      </section>

      {/* 4. Payment: Google Play in the Android app, nothing in the iPhone app (yet), Whop on the web */}
      {store === null ? (
        <p className="mt-6 py-4 text-center text-muted" role="status">Loading payment…</p>
      ) : android ? (
        <PlayCheckout offerId={chosen} offerName={offer.name} userId={user.id} />
      ) : store === "none" ? (
        <section className="mt-6 rounded-3xl bg-surface p-5 text-center" aria-label="Payment">
          <p className="font-semibold">Subscriptions aren&apos;t available in the iPhone app yet.</p>
          <p className="mt-1 text-sm text-muted">Already subscribed? Sign in with the same account and everything you&apos;ve unlocked is here.</p>
        </section>
      ) : (
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
        ) : demo && offer.planType === "renewal" ? (
          <form action={setDemoPlan.bind(null, chosen as OfferId)}>
            <button className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Start my free trial (demo)</button>
            <p className="mt-2 text-center text-xs text-muted">Demo mode: add your Whop plan IDs to take real payments.</p>
          </form>
        ) : (
          <p className="rounded-2xl bg-surface p-4 text-sm text-muted">This upgrade goes live once its Whop plan is set up.</p>
        )}
        {error && <p role="alert" className="mt-2 text-center text-sm text-tomato">{error}</p>}
        <p className="mt-3 text-center text-xs text-muted">Secure payment by Whop. Cancel any time before your trial ends and you won&apos;t be charged.</p>
        {chosen === "executive" && (
          <p className="mt-2 text-center text-xs text-muted">Backed by the <Link href="/guarantee" className="underline">10 Perfect Dishes Money-Back Guarantee</Link>.</p>
        )}
      </section>
      )}


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
      <span className="mt-1 block pl-9 text-sm font-bold">
        {offer.regularPrice && <span className="mr-2 font-normal text-muted line-through">{offer.regularPrice}</span>}
        {offer.priceLine}
      </span>
      {checked && (
        <ul className="mt-2 space-y-1 pl-9 text-sm">
          {offer.includes.map((i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-basil">✓</span>
              <BenefitText text={i} />
            </li>
          ))}
          {offer.excludes.map((i) => <li key={i} className="text-muted line-through">✕ {i}</li>)}
        </ul>
      )}
      {offer.badge && <span className="absolute -top-2.5 right-4 rounded-full bg-button px-2.5 py-0.5 text-xs font-bold text-button-ink">{offer.badge}</span>}
    </label>
  );
}

/** "Benefit (Feature)": the benefit in full, the feature name on one line and quieter. */
function BenefitText({ text }: { text: string }) {
  const m = /^(.*?)\s*\(([^)]+)\)$/.exec(text);
  if (!m) return <span>{text}</span>;
  return (
    <span>
      {m[1]} <span className="whitespace-nowrap text-muted">({m[2]})</span>
    </span>
  );
}
