"use client";

import { useState } from "react";
import { setDemoPlan } from "@/app/actions/viewer";

/** Starts Stripe Checkout, or a local demo trial when Stripe isn't configured. */
export function PremiumCheckout({ stripeReady, country }: { stripeReady: boolean; country: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkout(interval: "year" | "month") {
    setBusy(true);
    setError(null);
    try {
      // TODO(auth): pass the signed-in Supabase user's ID and email.
      const res = await fetch("/api/billing/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, country, userId: "anonymous" }),
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

  if (!stripeReady) {
    return (
      <form action={setDemoPlan.bind(null, "premium")} className="mt-8">
        <button className="min-h-14 w-full max-w-md rounded-full bg-ink px-6 text-lg font-bold text-bg">Start free trial (demo)</button>
        <p className="mt-2 text-xs text-muted">Demo mode: Stripe keys aren&apos;t set, so this unlocks Premium on this device only.</p>
      </form>
    );
  }
  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
      <button disabled={busy} onClick={() => checkout("year")} className="min-h-14 rounded-full bg-ink px-6 text-lg font-bold text-bg disabled:opacity-60">
        Start free trial, then yearly
      </button>
      <button disabled={busy} onClick={() => checkout("month")} className="min-h-12 rounded-full border border-line px-6 font-semibold disabled:opacity-60">
        Start free trial, then monthly
      </button>
      {error && <p role="alert" className="text-sm text-tomato">{error}</p>}
    </div>
  );
}
