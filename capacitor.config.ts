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
    // Sign-in and checkout pages that may open inside the app.
    allowNavigation: ["*.supabase.co", "accounts.google.com", "*.whop.com", "whop.com"],
  },
  ios: { contentInset: "always" },
  android: { allowMixedContent: false },
};

export default config;
