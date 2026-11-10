# Setting up The Chef's Golden

Everything below goes into a file named `.env.local` in the project folder (copy `.env.example`). Restart `npm run dev` after editing it. Never commit `.env.local`.

## 1. Supabase: accounts, Google and email sign-in

1. Create a project at https://supabase.com (free tier is fine).
2. **Project Settings → API**: copy
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, keep secret)
3. **SQL Editor**: paste the whole of `supabase/setup_all.sql` and press **Run** (once). It creates every table: profiles, recipes, subscriptions, giveaway entries, orders and the community.
4. **Authentication → URL Configuration**:
   - Site URL: your live address (e.g. `https://thechefsgolden.vercel.app`), or `http://localhost:3000` while testing.
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://<your-live-domain>/auth/callback` (and your preview tunnel URL if you use one).

### Email sign-in (magic link)
5. **Authentication → Sign In / Providers → Email**: make sure it's enabled. With keys set, the sign-in page shows **"Email me a sign-in link"**; the user taps the link in their inbox and lands back in the app signed in.
6. For real users, set up your own email sender under **Authentication → Emails → SMTP Settings** (e.g. Resend, Postmark, SendGrid). Supabase's built-in sender is rate-limited and only for testing.

### Google sign-in: the provider to turn on
7. In **Google Cloud Console** (https://console.cloud.google.com):
   1. Create a project, then **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name ("The Chef's Golden"), support email and logo.
   2. While the consent screen is in **Testing**, only listed **Test users** can sign in: add the email address(es) you want to test with (for example your own and the one you have).
   3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
      - Authorized JavaScript origins: `http://localhost:3000` and your live domain.
      - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase shows this exact URL on its Google provider page).
   4. Copy the **Client ID** and **Client secret**.
8. In Supabase **Authentication → Sign In / Providers → Google**: switch it **on**, paste the Client ID and Client secret, save.
9. When you're ready for the public, press **Publish app** on Google's consent screen so anyone with a Google account can sign in.

## 2. Gemini: AI rewrites (optional)
1. Create a key at https://aistudio.google.com/apikey → `GEMINI_API_KEY`.
2. Without a key, Golden uses its built-in skill engine; Mini You never needs Gemini.

## 3. Whop: payments (embedded checkout)

The checkout page shows Whop's payment form inside Golden (Whop Elements). Offers and prices live in `src/lib/billing/offers.ts` (identical in Golden and golden-v1): the **Golden Executive Chef System** ($100/year founding price, regular $500/year) and **The Golden Experience** ($50/year), both after the free 5-Day Zero-Waste Challenge (a 5-day trial with every feature unlocked).

**Option A: plans you create in Whop (simplest)**
1. In Whop, create one plan per offer with the same price, type and trial.
2. Copy each plan ID (`plan_…`) into `.env.local`: `WHOP_PLAN_EXECUTIVE` ($100/year founding price) and `WHOP_PLAN_EXPERIENCE` ($50/year), both with a 5-day free trial.

**Option B: let Golden create them (also enables Buy now, pay later)**
1. Whop dashboard → Developer → API keys: create a key → `WHOP_API_KEY`.
2. Your company ID (`biz_…`) → `WHOP_COMPANY_ID`.
3. Golden then creates a checkout configuration per purchase with metadata `order_id`, `golden_user_id`, `offer` (and `referred_by` for referrals). Ticking **Buy now, pay later** enables Klarna, Afterpay/Clearpay, Affirm, Sezzle, Zip and 3-month instalments where Whop offers them.

**Webhook (both options)**
- Developer → Webhooks: URL `https://<your-live-domain>/api/billing/whop/webhook`, events `payment.succeeded`, `membership.activated`, `membership.updated`. Secret (`ws_…`) → `WHOP_WEBHOOK_SECRET`. Golden marks the order paid and grants access from the webhook, never from the browser.
- After payment Whop returns buyers to `/checkout/return` with `payment` and `status`.

### Older link-based setup
1. In your Whop dashboard create a **product** (e.g. "The Chef's Golden Premium") with two **plans**: $100/year (Executive Chef System) and $50/year (The Golden Experience), each with a **5-day free trial**.
2. Copy each plan's **checkout link** →
   ```
   WHOP_CHECKOUT_URL_YEAR=https://whop.com/...
   WHOP_CHECKOUT_URL_MONTH=https://whop.com/...
   ```
3. **Checkout settings → redirect after purchase**: `https://<your-live-domain>/` so buyers come back to the app.
4. **Developer → Webhooks → Create webhook**: URL `https://<your-live-domain>/api/billing/whop/webhook`, events `membership.activated` and `membership.updated`. Copy the signing secret (`ws_…`) → `WHOP_WEBHOOK_SECRET`.
5. Webhooks need a public address: deploy first (step 5), or use a tunnel while testing.
6. Ask buyers to use the same email at Whop as in the app; memberships are saved with Whop's user ID for matching.

## 3b. Google Play Billing (Android app)

Inside the Android app Google Play is the merchant of record; the website keeps using Whop.

1. **Play Console → Monetize → Subscriptions:** create two subscriptions with exactly these IDs, each with an auto-renewing yearly base plan `yearly` and a 5-day free-trial offer on it:
   - `golden_executive`: $100/year (Golden Executive Chef System)
   - `golden_experience`: $50/year (The Golden Experience)
2. **Service account:** in Google Cloud create a service account and a JSON key. In the Play Console → Users and permissions, invite its email with *View financial data* and *Manage orders and subscriptions*. Put the whole JSON (one line) in `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` on Vercel (mark it sensitive).
3. **Notifications (RTDN):** create a Pub/Sub topic, grant `google-play-developer-notifications@system.gserviceaccount.com` *Publisher* on it, and add a push subscription to `https://<your-site>/api/billing/google/rtdn?token=<GOOGLE_RTDN_TOKEN>`. Set the topic in Play Console → Monetization setup and send a test notification.
4. **App:** `npm run build`, `npx cap sync android`, then build a release in Android Studio and upload it to an internal testing track. Add license testers (Play Console → Setup → License testing) to buy without being charged.

How it works: the app shows Google Play's prices and purchase sheet (`PlayBillingPlugin.java`), sends the purchase token to `verifyPlayPurchase`, which checks it with the Google Play Developer API (right product, same Golden account, not pending), saves it to `subscriptions`, acknowledges it and unlocks Premium. RTDN updates renewals, cancellations and expiries the same way.

## 4. Analytics
- **PostHog** (built in): create a project at https://posthog.com and set `NEXT_PUBLIC_POSTHOG_KEY` (and `NEXT_PUBLIC_POSTHOG_HOST` if you chose the EU region: `https://eu.i.posthog.com`). The app sends page views plus these events: `signin_started`, `mini_you_created`, `onboarding_completed`, `checkout_started`, `trial_started`, `dish_cooked`, `mistake_fixed`. In PostHog, build a **Funnel**: `$pageview` on `/welcome` → `signin_started` → `onboarding_completed` → `checkout_started` to see where people drop off.
- **Vercel Web Analytics + Speed Insights**: switch them on in the Vercel project's Analytics tab after deploying (page views and real-user performance, no code needed beyond Vercel's toggle and package).
- Respecting privacy: events are skipped when the browser sends Do Not Track, and no photos or recipe text are ever sent. Add a cookie/analytics notice to your privacy policy before launch.

## 5. Going live (Vercel)
1. Push to GitHub (already set up: `princeizere57-pixel/the-chefs-ai`).
2. On https://vercel.com: **Add New → Project → import the repo**.
3. Paste every variable from `.env.local` into **Settings → Environment Variables**.
4. Deploy, then add the live URL to Supabase (step 1.4), Google (step 1.7.3) and Whop (steps 3.3–3.4).
5. The recipe library cache isn't committed: add a build step or run `npm run data:mealdb` locally and let pages fall back to the live TheMealDB API (both work).

## Build the phone apps (Android and iPhone)

The apps load the live site, so most changes reach them without a new build. Rebuild when the
icons, splash screen, app settings (`capacitor.config.ts`) or native code change.

1. `npm install`, then `npx cap sync` (copies the settings and the offline page into `android/` and `ios/`; those copies are not in git).
2. **Android** (any computer with Android Studio): `npx cap open android`, then Build → Generate Signed App Bundle (`.aab`) and upload it to a Play Console testing track. From a terminal with the Android SDK installed: `cd android && ./gradlew bundleRelease` (signing set up in `android/app/build.gradle`).
3. **iPhone** (a Mac with Xcode): `npx cap open ios`, choose your team under Signing & Capabilities, then Product → Archive and upload to App Store Connect / TestFlight.
4. After installing, check: the black claw icon and splash, the loader on page changes, and that checkout shows Google Play on Android and no payment option on iPhone (never Whop).
