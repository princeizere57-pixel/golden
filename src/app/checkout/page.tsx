import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getUser } from "@/lib/auth";
import { launchState } from "@/lib/billing/launch";
import { DEFAULT_OFFER, OFFERS, money, offerById, priceLine } from "@/lib/billing/offers";
import { whopApiConfigured, whopEmbedConfigured } from "@/lib/billing/whop-checkout";
import { GIVEAWAY } from "@/lib/giveaway";
import { requestStore } from "@/lib/native/shell";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Checkout" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
const BENEFITS = {
  beginner: ["Recipes broken into small, jargon-free steps", "What to look, listen and smell for at every stage", "Fix My Mistake when something burns, splits or tastes off"],
  intermediate: ["Kitchen shorthand that keeps you moving", "Two or three dishes timed to finish together", "Fix My Mistake for sauces, seasoning and doneness"],
  chef: ["Technique-first methods with temperatures and targets", "The food science behind each step", "Multi-course timing for ambitious menus"],
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signin");
  const viewer = await getViewer();
  if (!viewer.onboarded) redirect("/onboarding");
  const [launch, store, { plan }] = await Promise.all([launchState(), requestStore(), searchParams]);
  // Experience members only see the upgrade; a locked screen's ?plan= preselects its plan.
  const offers = viewer.tier === "experience" ? OFFERS.filter((o) => o.id === "executive") : OFFERS;
  const preselect = offerById(plan ?? "") && offers.some((o) => o.id === plan) ? plan! : offers.some((o) => o.id === DEFAULT_OFFER) ? DEFAULT_OFFER : offers[0].id;
  const web = store === "web";

  return (
    <CheckoutPanel
      user={{ id: user.id, name: user.name, email: user.email }}
      level={LEVEL[viewer.skill]}
      tier={viewer.tier}
      store={store}
      offers={offers.map((o) => ({
        id: o.id,
        name: o.name,
        tagline: o.tagline,
        priceLine: priceLine(o),
        regularPrice: o.regularPrice ? `${money(o.regularPrice)}/year` : undefined,
        kind: o.kind,
        badge: o.badge,
        includes: o.includes,
        excludes: o.excludes ?? [],
        // Web payment only on the web: never inside the store apps.
        embedReady: web && whopEmbedConfigured(o),
        planType: o.planType,
      }))}
      defaultOffer={preselect}
      launch={{ left: launch.left, spots: launch.spots, endsOn: new Date(launch.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }), open: launch.open }}
      payLaterReady={web && whopApiConfigured()}
      drawDate={new Date(GIVEAWAY.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
      benefits={[...BENEFITS[viewer.skill], "Pantry-to-Plate Matcher, Chinese, Korean and Italian technique modules, and the community"]}
    />
  );
}
