import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutReturnActions } from "@/components/checkout-return-actions";

export const metadata: Metadata = { title: "Payment" };

/** Whop appends `payment` and `status` to our returnUrl; our own `order` survives. */
export default async function CheckoutReturn({ searchParams }: { searchParams: Promise<{ payment?: string; status?: string; order?: string }> }) {
  const { payment, status, order } = await searchParams;

  if (status === "succeeded") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-[2.2rem]">Welcome to <span className="text-gold">Gold</span>en</h1>
        <p className="mt-3 text-muted">Payment {payment} is complete. A receipt is on its way to your email, and your access unlocks as soon as Whop confirms it.</p>
        <CheckoutReturnActions succeeded />
      </main>
    );
  }

  if (status === "failed" || status === "canceled") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-[2rem]">Your payment didn&apos;t go through</h1>
        <p className="mt-3 text-muted">No money was taken. You can try again with another payment method.</p>
        <Link href={`/checkout?order=${encodeURIComponent(order ?? "")}`} className="mt-8 flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Back to checkout</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-[2rem]">Confirming your payment</h1>
      <p className="mt-3 text-muted">Your payment is still being processed. We&apos;ll email you as soon as it&apos;s confirmed.</p>
      <CheckoutReturnActions />
    </main>
  );
}
