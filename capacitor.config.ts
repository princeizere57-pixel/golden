import type { CapacitorConfig } from "@capacitor/cli";

// Native iPhone and Android shells for Golden. The apps load the live site, so every push to
// GitHub (auto-deployed by Vercel) reaches the apps without an app-store resubmission.
// mobile/www is only the offline fallback page bundled inside the app.
const config: CapacitorConfig = {
  appId: "com.golden.cooking",
  appName: "Golden",
  webDir: "mobile/www",
  server: {
    url: "https://golden-two-pi.vercel.app",
    cleartext: false,
    errorPath: "index.html",
    // Sign-in pages that may open inside the app. No web payment pages: inside the store apps,
    // subscriptions go through Google Play Billing (Android) and Apple in-app purchase (iPhone).
    allowNavigation: ["*.supabase.co", "accounts.google.com"],
  },
  // The server reads these to hide web payment inside the apps (src/lib/native/user-agent.ts).
  ios: { contentInset: "always", appendUserAgent: "GoldenApp/ios" },
  android: { allowMixedContent: false, appendUserAgent: "GoldenApp/android" },
};

export default config;
