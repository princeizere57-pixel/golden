import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getUser } from "@/lib/auth";
import { OFFERS, priceLine } from "@/lib/billing/offers";
import { whopApiConfigured, whopEmbedConfigured } from "@/lib/billing/whop-checkout";
import { GIVEAWAY } from "@/lib/giveaway";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Checkout" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
const BENEFITS = {
  beginner: ["Recipes broken into small, jargon-free steps", "What to look, listen and smell for at every stage", "Fix My Mistake when something burns, splits or tastes off"],
  intermediate: ["Kitchen shorthand that keeps you moving", "Two or three dishes timed to finish together", "Fix My Mistake for sauces, seasoning and doneness"],
  chef: ["Technique-first methods with temperatures and targets", "The food science behind each step", "Multi-course timing for ambitious menus"],
};

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/signin");
  const viewer = await getViewer();
  if (!viewer.onboarded) redirect("/onboarding");

  return (
    <CheckoutPanel
      user={{ name: user.name, email: user.email }}
      level={LEVEL[viewer.skill]}
      premium={viewer.plan === "premium"}
      offers={OFFERS.map((o) => ({
        id: o.id,
        name: o.name,
        tagline: o.tagline,
        priceLine: priceLine(o),
        kind: o.kind,
        badge: o.badge,
        includes: o.includes,
        embedReady: whopEmbedConfigured(o),
        planType: o.planType,
      }))}
      payLaterReady={whopApiConfigured()}
      drawDate={new Date(GIVEAWAY.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
      benefits={[...BENEFITS[viewer.skill], "Pantry-first recipes, smart shopping lists and the Apprentice Meets Master community"]}
    />
  );
}
