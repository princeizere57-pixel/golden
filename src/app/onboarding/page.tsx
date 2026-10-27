import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { PRICES, TRIAL_DAYS, formatMoney } from "@/lib/billing/routing";
import { libraryRecipes } from "@/lib/library";
import { thumb } from "@/lib/mealdb/convert";
import { RECIPES } from "@/lib/data/recipes";

export const metadata: Metadata = { title: "Find your level" };

export default function OnboardingPage() {
  const year = PRICES.usd.year;
  const priceLine = `${TRIAL_DAYS} days free, then ${formatMoney(year)}/year (${formatMoney({ amount: Math.round(year.amount / 12), currency: "usd" })}/mo, billed annually)`;
  const images = [...RECIPES, ...libraryRecipes().slice(0, 6)].flatMap((r) => (r.image ? [thumb(r.image)] : [])).slice(0, 5);
  return <OnboardingFlow images={images} stripeReady={Boolean(process.env.STRIPE_US_SECRET_KEY || process.env.STRIPE_UK_SECRET_KEY)} priceLine={priceLine} />;
}
