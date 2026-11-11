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
/** What they unlock at their level: the problem it ends, the value instead, the feature in brackets. */
const BENEFITS = {
  beginner: ["No more guessing: small jargon-free steps that work first time (Skill-Adaptation Engine)", "No more over- or undercooking: know it's done by look, sound and smell (Sensory Cues)", "No more binned dinners: burnt, split or salty, fixed in seconds (Fix My Mistake)"],
  intermediate: ["No more slow, fiddly recipes: shorthand that keeps you moving (Skill-Adaptation Engine)", "No more cold sides: two or three dishes ready at the same minute (Multi-Dish Timing)", "No more ruined sauces: seasoning and doneness rescued in seconds (Fix My Mistake)"],
  chef: ["No more near-misses: exact temperatures and targets every time (Technique-First Methods)", "No more following blindly: the science behind each step, so you improvise (Food Science Notes)", "No more stressful dinner parties: multi-course menus served on time (Multi-Dish Timing)"],
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
      benefits={[...BENEFITS[viewer.skill], "No more food going off: dinner from what's already in your fridge (Pantry-to-Plate)"]}
    />
    </>
  );
}
