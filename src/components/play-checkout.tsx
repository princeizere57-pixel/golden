"use client";

// Checkout inside the Android app: Google Play is the merchant of record. Prices come from
// Google Play (in the buyer's currency), Google's own purchase sheet takes payment, and the
// server confirms the subscription with Google before unlocking Premium.

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { verifyPlayPurchase } from "@/app/actions/play";
import { PLAY_PRODUCTS, describePlayOffer, pickPlayOffer, playProductFor, type PlayProductDetails } from "@/lib/billing/play-products";
import { PLAY_CANCELLED, PlayBilling } from "@/lib/native/play-billing";

export function PlayCheckout({ offerId, offerName, userId }: { offerId: string; offerName: string; userId: string }) {
  const router = useRouter();
  const [details, setDetails] = useState<PlayProductDetails[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    PlayBilling.getProducts({ productIds: PLAY_PRODUCTS.map((p) => p.productId) })
      .then((r) => setDetails(r.products))
      .catch(() => setError("Google Play isn't available right now. Check you're signed in to the Play Store and try again."));
  }, []);

  const product = playProductFor(offerId);
  const productDetails = product && details?.find((d) => d.productId === product.productId);
  const offer = product && productDetails ? pickPlayOffer(productDetails, product.basePlanId) : undefined;

  function confirm(productId: string, token: string) {
    return verifyPlayPurchase(productId, token).then((r) => {
      if (!r.ok) throw new Error(r.error);
      if (r.premium) router.push("/?trial=started");
      else setError("Google Play says this subscription isn't active.");
    });
  }

  function buy() {
    if (!product || !offer) return;
    setError(null);
    start(async () => {
      try {
        const purchase = await PlayBilling.purchase({ productId: product.productId, offerToken: offer.offerToken, accountId: userId });
        if (purchase.purchaseState === 2) {
          setError("Your payment is pending with Google Play. Premium unlocks as soon as it goes through.");
          return;
        }
        await confirm(product.productId, purchase.purchaseToken);
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === PLAY_CANCELLED) return;
        setError(e instanceof Error && e.message ? e.message : "The purchase didn't go through. You haven't been charged.");
      }
    });
  }

  function restore() {
    setError(null);
    start(async () => {
      try {
        const { purchases } = await PlayBilling.getPurchases();
        const ours = purchases.find((p) => p.purchaseState === 1 && p.products.some((id) => PLAY_PRODUCTS.some((x) => x.productId === id)));
        if (!ours) {
          setError("No Golden subscription found on this Google account.");
          return;
        }
        await confirm(ours.products[0], ours.purchaseToken);
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : "Couldn't check your purchases. Try again.");
      }
    });
  }

  return (
    <section className="mt-6" aria-label="Payment with Google Play">
      <button
        onClick={buy}
        disabled={pending || !offer}
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-60"
      >
        {pending ? "Waiting for Google Play…" : offer ? `Continue: ${describePlayOffer(offer)}` : details ? `${offerName} isn't on sale in Google Play yet` : "Loading Google Play prices…"}
      </button>
      {error && <p role="alert" className="mt-2 text-center text-sm text-tomato">{error}</p>}
      <p className="mt-3 text-center text-xs text-muted">
        Billed by Google Play. Cancel any time in the Play Store before your free days end and you won&apos;t be charged.
      </p>
      <button onClick={restore} disabled={pending} className="mt-1 flex min-h-11 w-full items-center justify-center text-sm font-medium underline">Restore purchases</button>
    </section>
  );
}
