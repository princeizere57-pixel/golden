import type { Metadata } from "next";
import { headers } from "next/headers";
import { PremiumCheckout } from "@/components/premium-checkout";
import { PRICES, TRIAL_DAYS, annualSavingPercent, formatMoney, routeEntity } from "@/lib/billing/routing";

export const metadata: Metadata = { title: "Premium" };

const FEATURES = [
  "Every recipe rewritten for your skill level",
  "Hands-free cook mode with parallel timers",
  "Fix My Mistake with exact quantities",
  "Multi-dish meal timing",
  "All Premium recipes",
];

export default async function PremiumPage() {
  // Display currency follows the visitor's country; checkout re-routes on the billing address.
  const country = (await headers()).get("x-vercel-ip-country");
  const { currency } = routeEntity(country);
  const { year, month } = PRICES[currency];
  const stripeReady = Boolean(process.env.STRIPE_US_SECRET_KEY || process.env.STRIPE_UK_SECRET_KEY);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 pb-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Cook anything, at your level.</h1>
      <p className="mt-3 text-lg text-muted">{TRIAL_DAYS} days free. Cancel any time before it ends and you won&apos;t be charged.</p>

      <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-3xl border-2 border-accent bg-surface p-6">
          <p className="text-sm font-semibold text-accent">Best value · save {annualSavingPercent(currency)}%</p>
          <p className="mt-2 text-4xl font-bold">{formatMoney(year)}<span className="text-base font-normal text-muted">/year</span></p>
          <p className="mt-1 text-sm text-muted">After your {TRIAL_DAYS}-day free trial</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-semibold text-muted">Monthly</p>
          <p className="mt-2 text-4xl font-bold">{formatMoney(month)}<span className="text-base font-normal text-muted">/month</span></p>
          <p className="mt-1 text-sm text-muted">{formatMoney({ amount: month.amount * 12, currency })} a year</p>
        </div>
      </div>

      <ul className="mx-auto mt-8 max-w-md space-y-2 text-left">
        {FEATURES.map((f) => <li key={f} className="flex gap-2"><span aria-hidden className="text-accent">✓</span>{f}</li>)}
      </ul>

      <PremiumCheckout stripeReady={stripeReady} country={country} />
      <p className="mt-4 text-xs text-muted">On iPhone and Android, subscribe in the app through the App Store or Google Play.</p>
    </main>
  );
}
