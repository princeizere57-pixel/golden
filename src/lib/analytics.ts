// Product analytics. Sends events to PostHog's capture API when NEXT_PUBLIC_POSTHOG_KEY is set;
// otherwise does nothing. Honours Do Not Track and never sends photos or recipe text.
// Client-side only.

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
const ID_KEY = "bac-analytics-id";

export type AnalyticsEvent =
  | "$pageview"
  | "signin_started"
  | "mini_you_created"
  | "onboarding_completed"
  | "checkout_started"
  | "trial_started"
  | "dish_cooked"
  | "mistake_fixed"
  | "pantry_match";

function distinctId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function analyticsEnabled(): boolean {
  return Boolean(KEY) && typeof window !== "undefined" && navigator.doNotTrack !== "1";
}

export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean | undefined> = {}) {
  if (!analyticsEnabled()) return;
  const body = JSON.stringify({
    api_key: KEY,
    event,
    distinct_id: distinctId(),
    properties: { ...properties, $current_url: window.location.href, $pathname: window.location.pathname },
    timestamp: new Date().toISOString(),
  });
  // sendBeacon survives page navigations (e.g. leaving for checkout).
  if (!navigator.sendBeacon?.(`${HOST}/capture/`, new Blob([body], { type: "application/json" }))) {
    fetch(`${HOST}/capture/`, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}
