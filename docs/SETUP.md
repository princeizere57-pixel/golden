# Setting up The Chef's Golden

Everything below goes into a file named `.env.local` in the project folder (copy `.env.example`). Restart `npm run dev` after editing it. Never commit `.env.local`.

## 1. Supabase: accounts, Google and email sign-in

1. Create a project at https://supabase.com (free tier is fine).
2. **Project Settings → API**: copy
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, keep secret)
3. **SQL Editor**: run the files in `supabase/migrations/` in order (`0001_init.sql`, `0002_imported_recipes.sql`, `0003_whop.sql`).
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

## 2. Gemini: AI rewrites and the 3D cartoon Mini You
1. Create a key at https://aistudio.google.com/apikey → `GEMINI_API_KEY`.
2. The 3D cartoon uses `GEMINI_IMAGE_MODEL` (default `gemini-2.5-flash-image`). Image generation may need billing enabled on the Google project.
3. The selfie is sent to Gemini **only** when the user taps "Make my 3D cartoon"; the app says so on that screen.

## 3. Whop: payments
1. In your Whop dashboard create a **product** (e.g. "The Chef's Golden Premium") with two **plans**: $45/year and $7.99/month, each with a **7-day free trial**.
2. Copy each plan's **checkout link** →
   ```
   WHOP_CHECKOUT_URL_YEAR=https://whop.com/...
   WHOP_CHECKOUT_URL_MONTH=https://whop.com/...
   ```
3. **Checkout settings → redirect after purchase**: `https://<your-live-domain>/` so buyers come back to the app.
4. **Developer → Webhooks → Create webhook**: URL `https://<your-live-domain>/api/billing/whop/webhook`, events `membership.activated` and `membership.updated`. Copy the signing secret (`ws_…`) → `WHOP_WEBHOOK_SECRET`.
5. Webhooks need a public address: deploy first (step 5), or use a tunnel while testing.
6. Ask buyers to use the same email at Whop as in the app; memberships are saved with Whop's user ID for matching.

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
