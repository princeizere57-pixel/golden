// Golden's phone apps add "GoldenApp/android" or "GoldenApp/ios" to their user agent
// (capacitor.config.ts), so the server knows a page is opening inside an app-store app before any
// JavaScript runs. Inside those apps, digital subscriptions must go through the store's own billing
// (Google Play Billing; Apple in-app purchase), so the server never renders web payment there.
// Pure, so it's tested.

export type Shell = "android" | "ios" | null;

export function shellFromUserAgent(ua: string | null | undefined): Shell {
  const m = /\bGoldenApp\/(android|ios)\b/i.exec(ua ?? "");
  return m ? (m[1].toLowerCase() as Shell) : null;
}

/** How this screen may take payment: Whop on the web, Google Play in the Android app, none in the iPhone app (no in-app purchase yet). */
export type Store = "web" | "google_play" | "none";

export const storeFor = (shell: Shell): Store => (shell === "android" ? "google_play" : shell === "ios" ? "none" : "web");
