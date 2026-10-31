"use client";

// Whop's embedded checkout (Whop Elements). Fulfilment happens in the webhook, never here.

import { Checkout, CheckoutElement, WhopElements } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

type Props = {
  plan?: string;
  checkoutConfiguration?: string;
  metadata: Record<string, string>;
  returnUrl: string;
  offer: string;
};

export function WhopEmbed({ plan, checkoutConfiguration, metadata, returnUrl, offer }: Props) {
  // Load the SDK in the browser only.
  const [elements, setElements] = useState<ReturnType<typeof loadWhop> | null>(null);
  useEffect(() => setElements(loadWhop()), []);
  if (!elements) return <p className="py-8 text-center text-muted">Loading secure checkout…</p>;

  return (
    <WhopElements elements={elements}>
      <Checkout
        {...(checkoutConfiguration ? { checkoutConfiguration } : { plan })}
        metadata={metadata}
        returnUrl={returnUrl}
        fallback={<p className="py-8 text-center text-muted">Loading secure checkout…</p>}
        onComplete={(completion) => {
          if (completion.result === "payment") track("trial_started", { offer, provider: "whop" });
        }}
      >
        <CheckoutElement />
      </Checkout>
    </WhopElements>
  );
}
