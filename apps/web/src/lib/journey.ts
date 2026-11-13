// First-run sequence: /welcome → /signin → /onboarding (Mini You + questions) → /checkout.
// The app opens once someone has signed in and answered the questions (or finished checkout,
// which sets JOURNEY_COOKIE). Until then the home address shows the welcome page.

export const JOURNEY_COOKIE = "bac-journey";
const SKILL_COOKIE = "bac-skill";

/**
 * Better Auth's session cookie; over https it carries the __Secure- prefix. The edge middleware
 * only checks presence (it can't reach the database) — getUser() is what actually validates it.
 */
export const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

/** Pages that belong to the sequence (plus framework and API paths) and are always reachable. */
export function isJourneyPath(pathname: string): boolean {
  return (
    /^\/(welcome|signin|auth|onboarding|checkout|giveaway|guarantee)(\/|$)/.test(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

/** Signed in and has a level from the questions, or finished checkout. */
export function journeyComplete(cookies: { has(name: string): boolean; get(name: string): { value: string } | undefined }): boolean {
  return cookies.get(JOURNEY_COOKIE)?.value === "done" || (SESSION_COOKIES.some((n) => cookies.has(n)) && cookies.has(SKILL_COOKIE));
}
