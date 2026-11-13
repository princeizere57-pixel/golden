import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { getDb } from "./db/client.js";
import * as schema from "./db/schema.js";
import { env } from "./env.js";

// baseURL is the WEB origin, not the API's: the web app proxies /api/auth/* here, so the session
// cookie stays first-party on the web domain (*.vercel.app subdomains can't share cookies).
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  trustedOrigins: [env.WEB_ORIGIN],
  database: drizzleAdapter(getDb(), { provider: "pg", schema }),
  // UUID ids keep the existing ^[0-9a-f-]{36}$ guards (subscriptions/feedback/checkout) valid.
  advanced: { database: { generateId: "uuid" } },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    magicLink({
      // shortcut: logs the link instead of emailing it; wire Resend (or similar) before launch (G7).
      sendMagicLink: async ({ email, url }) => {
        console.log(`[magic-link] ${email} -> ${url}`);
      },
    }),
  ],
});
