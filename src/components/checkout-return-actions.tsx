"use client";

import { useEffect } from "react";
import { finishJourney } from "@/app/actions/viewer";
import { track } from "@/lib/analytics";

/** Opens the app after checkout. Access itself is granted by the Whop webhook. */
export function CheckoutReturnActions({ succeeded = false }: { succeeded?: boolean }) {
  useEffect(() => {
    if (succeeded) track("trial_started", { provider: "whop", via: "return" });
  }, [succeeded]);
  return (
    <form action={finishJourney} className="mt-8 w-full">
      <button className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink">Start cooking</button>
    </form>
  );
}
