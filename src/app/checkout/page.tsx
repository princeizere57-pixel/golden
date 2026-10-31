import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getUser } from "@/lib/auth";
import { ENTITIES, PRICES, TRIAL_DAYS, annualSavingPercent, formatMoney, routeEntity } from "@/lib/billing/routing";
import { whopCheckoutUrl } from "@/lib/billing/whop";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Checkout" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
const METHODS: Record<string, string> = { card: "Card", apple_pay: "Apple Pay", google_pay: "Google Pay", pay_by_bank: "Pay by Bank" };

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/signin");
  const viewer = await getViewer();
  if (!viewer.onboarded) redirect("/onboarding");

  const country = (await headers()).get("x-vercel-ip-country");
  const entity = routeEntity(country);
  const { year, month } = PRICES[entity.currency];
  const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toLocaleDateString(entity.currency === "gbp" ? "en-GB" : "en-US", { day: "numeric", month: "long" });

  return (
    <CheckoutPanel
      user={{ id: user.id, name: user.name, email: user.email }}
      level={LEVEL[viewer.skill]}
      premium={viewer.plan === "premium"}
      whop={{ year: whopCheckoutUrl("year"), month: whopCheckoutUrl("month") }}
      stripeReady={Boolean(process.env.STRIPE_US_SECRET_KEY || process.env.STRIPE_UK_SECRET_KEY)}
      country={country}
      trialDays={TRIAL_DAYS}
      trialEnds={trialEnds}
      plans={{
        year: { price: formatMoney(year), perMonth: formatMoney({ amount: Math.round(year.amount / 12), currency: entity.currency }), saving: annualSavingPercent(entity.currency) },
        month: { price: formatMoney(month) },
      }}
      zero={formatMoney({ amount: 0, currency: entity.currency })}
      methods={ENTITIES[entity.entity].paymentMethods.map((m) => METHODS[m] ?? m)}
    />
  );
}
