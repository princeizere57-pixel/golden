import type { Metadata } from "next";
import Link from "next/link";
import { GIVEAWAY } from "@/lib/giveaway";

export const metadata: Metadata = { title: "Golden Giveaway rules" };

// DRAFT official rules. Have them reviewed for the US and UK (sweepstakes / prize-promotion law)
// before running the giveaway publicly.
export default function GiveawayRules() {
  const ends = new Date(GIVEAWAY.endsAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });
  return (
    <main className="mx-auto px-5 py-10">
      <Link href="/" className="text-sm underline">← Back</Link>
      <h1 className="mt-4 font-display text-[2.2rem]">The Golden Giveaway: official rules</h1>
      <ol className="mt-6 list-decimal space-y-4 pl-5">
        <li><strong>No purchase necessary.</strong> Buying a plan does not improve your chances of winning.</li>
        <li><strong>Who can enter:</strong> residents of the United States (excluding where prohibited) and the United Kingdom, aged 18 or over, with a Golden account.</li>
        <li><strong>How to enter:</strong> sign up for a free Golden account and tap &ldquo;Enter the giveaway&rdquo; on the checkout page. One entry per person.</li>
        <li><strong>Referrals:</strong> each entrant gets a personal link. If someone who joined through your link is drawn as the winner, you also receive the referral prize. Referrals don&apos;t add extra entries.</li>
        <li><strong>Prize:</strong> {GIVEAWAY.prize}. No cash alternative. Prizes are non-transferable.</li>
        <li><strong>Draw:</strong> one winner chosen at random from all valid entries after {ends} UTC, and contacted by the email on their account. If they don&apos;t reply within 14 days, a new winner is drawn.</li>
        <li><strong>Privacy:</strong> we use your name and email only to run the giveaway and contact the winner.</li>
        <li>Void where prohibited. The organiser may cancel or change the giveaway if it can&apos;t run as planned.</li>
      </ol>
    </main>
  );
}
