"use client";

// Whop's embedded checkout (Whop Elements). Fulfilment happens in the webhook, never here.

import { Checkout, CheckoutElement, WhopElements } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { Component, useEffect, useState, type ReactNode } from "react";
import { openHostedCheckout } from "@/app/actions/checkout";
import { track } from "@/lib/analytics";

let whop: ReturnType<typeof loadWhop> | null = null;
/** Start loading Whop's script now (one shared load), so the form is ready sooner when needed. */
export function warmWhop() {
  if (!whop) {
    whop = loadWhop();
    whop.catch(() => {}); // a failed load is handled where the form is shown
  }
  return whop;
}

/** If anything inside Whop's form throws, show the way out instead of crashing the checkout page. */
class WhopBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** "Loading…", then after a few seconds a way out: Whop's own checkout page, with this order attached. */
function SlowFallback({ offer, orderId, failed = false }: { offer: string; orderId: string; failed?: boolean }) {
  const [slow, setSlow] = useState(failed);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  async function open() {
    setOpening(true);
    setError(null);
    const r = await openHostedCheckout(offer, orderId, window.location.origin);
    if ("url" in r) window.location.href = r.url;
    else {
      setError(r.error);
      setOpening(false);
    }
  }
  return (
    <div className="py-8 text-center" role="status">
      <p className="text-muted">{failed ? "Whop's form couldn't load here (a blocker or a weak connection)." : slow ? "Whop's form is taking longer than usual." : "Loading secure checkout…"}</p>
      {(slow || failed) && (
        <button onClick={open} disabled={opening} className="mt-4 min-h-12 w-full rounded-full bg-button font-semibold text-button-ink disabled:opacity-60">
          {opening ? "Opening Whop…" : "Open secure checkout"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-tomato" role="alert">{error}</p>}
    </div>
  );
}

type Props = {
  plan?: string;
  checkoutConfiguration?: string;
  metadata: Record<string, string>;
  returnUrl: string;
  offer: string;
};

export function WhopEmbed({ plan, checkoutConfiguration, metadata, returnUrl, offer }: Props) {
  // Load the SDK in the browser only.
  // Wait for Whop's script before drawing its form: if it can't load, offer the hosted page instead.
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    let live = true;
    warmWhop().then(() => live && setState("ready"), () => live && setState("failed"));
    return () => {
      live = false;
    };
  }, []);
  const orderId = metadata.order_id ?? "";
  if (state !== "ready") return <SlowFallback offer={offer} orderId={orderId} failed={state === "failed"} />;

  return (
    <WhopBoundary fallback={<SlowFallback offer={offer} orderId={orderId} failed />}>
    <WhopElements elements={warmWhop()}>
      <Checkout
        {...(checkoutConfiguration ? { checkoutConfiguration } : { plan })}
        metadata={metadata}
        returnUrl={returnUrl}
        fallback={<SlowFallback offer={offer} orderId={orderId} />}
        onComplete={(completion) => {
          if (completion.result === "payment") track("trial_started", { offer, provider: "whop" });
        }}
      >
        <CheckoutElement />
      </Checkout>
    </WhopElements>
    </WhopBoundary>
  );
}
