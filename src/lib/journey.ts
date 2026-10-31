// First-run sequence: /welcome → /signin → /onboarding (Mini You + questions) → /checkout.
// The app itself opens only after checkout (trial started or "Not now"), which sets this cookie.

export const JOURNEY_COOKIE = "bac-journey";

/** Pages that belong to the sequence (plus framework and API paths) and are always reachable. */
export function isJourneyPath(pathname: string): boolean {
  return (
    /^\/(welcome|signin|auth|onboarding|checkout|giveaway)(\/|$)/.test(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}
