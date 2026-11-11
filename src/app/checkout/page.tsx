import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getUser } from "@/lib/auth";
import { launchState } from "@/lib/billing/launch";
import { DEFAULT_OFFER, OFFERS, money, offerById, priceLine } from "@/lib/billing/offers";
import { whopApiConfigured, whopEmbedConfigured } from "@/lib/billing/whop-checkout";
import { requestStore } from "@/lib/native/shell";
import { preloadHints } from "@whop/elements";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Checkout" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
/** What they unlock at their level: the result first, the feature that does it in brackets. */
const BENEFITS = {
  beginner: ["Get it right first time, in small jargon-free steps (Skill-Adaptation Engine)", "Know exactly when it's done by look, sound and smell (Sensory Cues)", "Burnt, split or too salty? Fixed in seconds (Fix My Mistake)"],
  intermediate: ["Cook faster with shorthand that keeps you moving (Skill-Adaptation Engine)", "Two or three dishes ready at the same minute (Multi-Dish Timing)", "Sauces, seasoning and doneness rescued in seconds (Fix My Mistake)"],
  chef: ["Hit exact temperatures and targets every time (Technique-First Methods)", "Know why each step works, so you can improvise (Food Science Notes)", "Ambitious multi-course menus served on time (Multi-Dish Timing)"],
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/signin");
  const viewer = await getViewer();
  if (!viewer.onboarded) redirect("/onboarding");
  const [launch, store, { plan }] = await Promise.all([launchState(), requestStore(), searchParams]);
  // Experience members only see the upgrade; a locked screen's ?plan= preselects its plan.
  const offers = viewer.access.plan === "experience" ? OFFERS.filter((o) => o.id === "executive") : OFFERS;
  const preselect = offerById(plan ?? "") && offers.some((o) => o.id === plan) ? plan! : offers.some((o) => o.id === DEFAULT_OFFER) ? DEFAULT_OFFER : offers[0].id;
  const web = store === "web";

  // Start connecting to Whop as the page arrives (web only; the store apps never show Whop).
  const hints = web ? preloadHints({ bankConnections: false }) : [];
  return (
    <>
    {hints.map((h) => <link key={h.rel + h.href} rel={h.rel} href={h.href} as={h.as} crossOrigin={h.crossOrigin} />)}
    <CheckoutPanel
      user={{ id: user.id, name: user.name, email: user.email }}
      level={LEVEL[viewer.skill]}
      tier={viewer.access.plan}
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
      launch={{ left: launch.left, spots: launch.spots, endsOn: new Date(launch.endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }), endsAt: launch.endsAt, open: launch.open }}
      payLaterReady={web && whopApiConfigured()}
      benefits={[...BENEFITS[viewer.skill], "Dinner from what's already in your fridge, no extra shop (Pantry-to-Plate)"]}
    />
    </>
  );
}
