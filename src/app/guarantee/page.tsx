import type { Metadata } from "next";
import Link from "next/link";
import { GUARANTEE, money, offerById } from "@/lib/billing/offers";

export const metadata: Metadata = { title: "Money-back guarantee" };

export default function GuaranteePage() {
  const executive = offerById("executive")!;
  return (
    <main className="mx-auto px-5 pb-12 pt-8">
      <Link href="/" className="text-sm underline">← Back</Link>
      <h1 className="mt-4 font-display text-[2rem]">The 10 Perfect Dishes <span className="text-accent">Money-Back Guarantee</span></h1>
      <p className="mt-3 text-muted">Applies to the Golden Executive Chef System ({money(executive.price)}/year founding price).</p>

      <h2 className="mt-8 text-xl font-semibold">What you do</h2>
      <p className="mt-2">Cook {GUARANTEE.dishes} full meals with Golden (cook mode or Plan a meal). Golden keeps a session log of every meal you cook on your Kitchen log.</p>

      <h2 className="mt-6 text-xl font-semibold">When you get your money back</h2>
      <p className="mt-2">If, after those {GUARANTEE.dishes} meals, you did not:</p>
      <ol className="mt-2 list-decimal space-y-1 pl-6">
        <li>get every dish on the table on time, with all of it hot,</li>
        <li>rescue at least one minor mistake with the Fix My Mistake AI Doctor, and</li>
        <li>notice a real reduction in your weekly food waste,</li>
      </ol>
      <p className="mt-2">send us a short log of your sessions within {GUARANTEE.days} days of your purchase and we refund 100% of what you paid.</p>

      <h2 className="mt-6 text-xl font-semibold">How to claim</h2>
      <p className="mt-2">Request the refund from your Whop account (the receipt for your Golden membership) or reply to your purchase receipt with your session log. Refunds go back to the original payment method.</p>

      <h2 className="mt-6 text-xl font-semibold">What you keep</h2>
      <p className="mt-2">Any guides, frameworks and cheat sheets you downloaded are yours to keep.</p>

      <p className="mt-8 text-sm text-muted">One refund per customer. The free 3-day challenge is never charged, so it doesn&apos;t need a refund: cancel before it ends.</p>
    </main>
  );
}
