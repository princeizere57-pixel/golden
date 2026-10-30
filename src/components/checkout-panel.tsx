"use client";

import Link from "next/link";
import { useState } from "react";
import { setDemoPlan } from "@/app/actions/viewer";
import { MiniYou } from "@/components/mini-you";

interface Props {
  user: { id: string; name: string; email: string };
  level: string;
  stripeReady: boolean;
  country: string | null;
  trialDays: number;
  trialEnds: string;
  plans: { year: { price: string; perMonth: string; saving: number }; month: { price: string } };
  zero: string;
  methods: string[];
}

/** Plan choice and trial start, after sign-in and the skill questions. */
export function CheckoutPanel({ user, level, stripeReady, country, trialDays, trialEnds, plans, zero, methods }: Props) {
  const [interval, setInterval] = useState<"year" | "month">("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const then = interval === "year" ? `${plans.year.price}/year` : `${plans.month.price}/month`;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, country, userId: user.id, email: user.email }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (body.url) window.location.assign(body.url);
      else setError(body.error ?? "Checkout is unavailable right now.");
    } catch {
      setError("Couldn't reach checkout. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/onboarding" aria-label="Back to your answers" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 5-7 7 7 7" /></svg>
        </Link>
        <span className="text-sm text-muted">Signed in as {user.email}</span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <MiniYou headOnly size={64} mood="happy" />
        <h1 className="font-display text-[2rem]">
          Your <span className="text-accent">{level}</span> plan is ready, {user.name.split(" ")[0]}
        </h1>
      </div>

      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">Choose a plan</legend>
        <PlanOption checked={interval === "year"} onChange={() => setInterval("year")} title="Yearly" price={`${plans.year.price}/year`} note={`Just ${plans.year.perMonth}/month · save ${plans.year.saving}%`} badge="Best value" />
        <PlanOption checked={interval === "month"} onChange={() => setInterval("month")} title="Monthly" price={`${plans.month.price}/month`} note="Flexible, cancel any time" />
      </fieldset>

      <dl className="mt-6 space-y-2 rounded-2xl bg-surface p-4 text-sm">
        <div className="flex justify-between"><dt>Due today</dt><dd className="font-bold">{zero}</dd></div>
        <div className="flex justify-between"><dt>{trialDays}-day free trial ends</dt><dd>{trialEnds}</dd></div>
        <div className="flex justify-between"><dt>Then</dt><dd>{then}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted">We&apos;ll remind you before your trial ends. Cancel any time in Account. Pay with {methods.join(", ")}.</p>

      <div className="mt-auto pt-8">
        {stripeReady ? (
          <button onClick={start} disabled={busy} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-60">
            {busy ? "Opening secure checkout…" : "Start my free trial"}
          </button>
        ) : (
          <form action={setDemoPlan.bind(null, "premium")}>
            <button className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Start my free trial (demo)</button>
            <p className="mt-2 text-center text-xs text-muted">Demo mode: Stripe isn&apos;t set up, so no payment is taken.</p>
          </form>
        )}
        {error && <p role="alert" className="mt-2 text-center text-sm text-tomato">{error}</p>}
        <Link href="/" className="mt-3 flex min-h-12 items-center justify-center font-medium">Not now, take me to my recipes</Link>
      </div>
    </main>
  );
}

function PlanOption({ checked, onChange, title, price, note, badge }: { checked: boolean; onChange: () => void; title: string; price: string; note: string; badge?: string }) {
  return (
    <label className={`relative flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 ${checked ? "border-accent bg-accent-soft" : "border-line"}`}>
      <input type="radio" name="plan" checked={checked} onChange={onChange} className="sr-only" />
      <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-accent" : "border-line"}`}>
        {checked && <span className="h-3 w-3 rounded-full bg-accent" />}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{note}</span>
      </span>
      <span className="font-bold">{price}</span>
      {badge && <span className="absolute -top-2.5 right-4 rounded-full bg-button px-2.5 py-0.5 text-xs font-bold text-button-ink">{badge}</span>}
    </label>
  );
}
