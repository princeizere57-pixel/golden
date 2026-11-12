# Golden: backend handover

Everything a backend developer needs to pick up Golden. Two repos share almost all of this code:

- **`princeizere57-pixel/golden`**: the app (web + Android/iPhone shells). Adds Google Play Billing.
- **`princeizere57-pixel/golden-v1`**: the same app plus the marketing landing page (`/landing`), `/challenge` and `/modules`.

Plans, prices, billing, auth, schema and server code are the same in both. When you change shared code, change both repos (or ask for them to be merged into one with two deploy targets: a good early task).

Read `CLAUDE.md` in the repo root too: it is the product and architecture rulebook.

---

## 1. Run it

```bash
npm install
cp .env.example .env.local        # everything is optional; empty = demo mode
npm run dev                        # http://localhost:3000
npm run typecheck && npm run lint && npm test    # must all pass before merging
npm run build                      # production build (also fetches the recipe cache)
```

- Node ≥ 22.18. Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript strict, Tailwind v4, Vitest.
- **Demo mode** (no Supabase keys): "Continue with Google" offers a labelled demo account, checkout has a demo Premium switch, and data lives in the browser. Good for UI work, not for backend work.
- Tests never touch the network: every external call takes an injectable `fetch`.
- Vercel deploys `main` to production automatically; every pushed branch gets a preview.

## 2. Architecture in one picture

```
Browser / Capacitor app
  │  pages: Server Components (src/app/**/page.tsx), client islands where needed
  │  mutations: Server Actions (src/app/actions/*.ts)
  ▼
Next.js on Vercel (Node runtime)
  │  src/lib/**  domain logic (pure + tested), billing, AI, auth
  │  src/app/api/billing/**  webhooks from Whop, Stripe, App Store, Google Play
  ▼
Supabase (Postgres + Auth)          Gemini (AI, optional)      TheMealDB (recipe library)
  service-role key, server-only       server-only key            cached a day + local JSON cache
```

The server talks to Supabase with **PostgREST over `fetch`** and the **service-role key** (`SUPABASE_SERVICE_ROLE_KEY`). The browser never gets that key. There is no Supabase JS client in the app yet.

## 3. Environment variables

All documented in `.env.example`. The ones that matter for the backend:

| Variable | Used for |
|---|---|
| `SESSION_SECRET` | Signs the sign-in and plan cookies (`src/lib/signed-cookie.ts`). Long random string. Falls back to `SUPABASE_SERVICE_ROLE_KEY`. **Set it in production.** Rotating it signs everyone out. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth (Google via Supabase OAuth, email magic link) and every table below. |
| `WHOP_*` | Web checkout. Plans: `WHOP_PLAN_EXECUTIVE` ($100/yr), `WHOP_PLAN_EXPERIENCE` ($50/yr); `WHOP_API_KEY` + `WHOP_COMPANY_ID` create plans inline if the IDs are empty; `WHOP_WEBHOOK_SECRET`. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_RTDN_TOKEN` | Android in-app subscriptions (Golden repo). See `docs/SETUP.md` §3b. |
| `STRIPE_US_*`, `STRIPE_UK_*` | Legacy Stripe path (US/UK entities). Whop is the live web checkout. |
| `APPLE_BUNDLE_ID` | App Store Server Notifications V2 (no iOS purchase flow in the app yet). |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI rewrites and Fix My Mistake photo diagnosis. Every AI feature has a non-AI fallback. |
| `MEALDB_API_KEY` | TheMealDB supporter key. Set in Vercel on 12 Nov 2026, but TheMealDB answered 404 for it on every address (`api/json/v2/<key>`, `<key>/json/v2`, `api/json/v1/<key>`), so the app falls back to the V1 test key. The build log line "TheMealDB …" shows which address worked. Fix: confirm the key in the TheMealDB account and update it in Vercel. |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Analytics (no-op without a key, honours Do Not Track). |

## 4. Database (Supabase)

Run the migrations in order (`supabase/migrations/0001…0006`), or paste `supabase/setup_all.sql` once into the SQL Editor. Row-level security is on for every table.

| Table | Migration | What it holds | Written by | Read by |
|---|---|---|---|---|
| `profiles` | 0001 | skill level, display name, billing country (one row per auth user, owner-only RLS) | **nothing yet** | nothing yet |
| `recipes`, `recipe_blocks` | 0001, 0005 | the seed recipes and their steps (public read) | `0005_seed_recipes.sql`, generated from code | **nothing yet** (the app reads `src/lib/data/*.ts`) |
| `segments` | 0001 | data-driven home page segments | nothing yet | nothing yet (defaults in code) |
| `pantry_items` | 0001 | a user's pantry (owner-only) | nothing yet | nothing yet (pantry is on-device) |
| `active_timers` | 0001 | running cook-mode timers | nothing yet | nothing yet (on-device) |
| `subscriptions` | 0001, 0003 | one row per subscription per provider (`whop`, `web` = Stripe, `app_store`, `google_play`): status, period end, `user_id`, `whop_user_id` | all four webhooks, `verifyPlayPurchase` | **`getViewer` → Premium** |
| `imported_recipes` | 0002 | private imports (owner-only) | nothing yet | nothing yet (imports are on-device) |
| `giveaway_entries` | 0004 | giveaway sign-ups + referral codes | `enterGiveaway` | giveaway |
| `orders` | 0004 | Whop checkout orders (pending → paid) | `startCheckout`, Whop webhook | — |
| `community_posts`, `community_replies` | 0004 | Apprentice Meets Master posts | `createPost`, `createReply` | `/community` |
| `feedback` | 0006 | in-app feedback after the 3rd meal: rating 1–5, note, meals finished | `sendFeedback` | you (Table Editor) |

`recipes`/`recipe_blocks` SQL is generated: after editing recipes in code run `UPDATE_SQL=1 npx vitest run tests/recipes-sql.test.ts`. A test fails if the SQL and the code drift apart.

### TheMealDB library in Supabase (migration 0008)

`mealdb_meals` (id, name, category, area, instructions, thumb, youtube, source, ingredients jsonb, date_modified) holds the whole TheMealDB library (793 meals on 12 Nov 2026). Every Vercel build upserts it from `scripts/seed-mealdb.mts` with the service role key, and rebuilds the app's recipe cache from it if TheMealDB is unreachable. Public read (it's public recipe data), server-only writes. **Run `supabase/migrations/0008_mealdb_meals.sql` once in the SQL editor**; until then the build logs "couldn't save the library" and carries on.

## 5. Auth and sessions

- `/signin` → Google (Supabase OAuth) or email magic link → `/auth/callback` → `completeGoogleSignIn` verifies the Supabase access token with Supabase (`verifySupabaseToken`), then stores **our own session**: the `bac-user` cookie, a **signed** (HMAC) JSON user `{ id, name, email, provider }`, httpOnly, 30 days.
- `getUser()` (`src/lib/auth.ts`) reads and verifies that cookie. An edited or unsigned cookie = signed out.
- The `user.id` is the Supabase `auth.users` id (UUID) for real accounts; demo accounts are `demo-…` and never touch the database.
- Middleware (`src/middleware.ts` + `src/lib/journey.ts`) only gates pages until sign-in + onboarding are done; real authorisation happens in each page/action via `getUser()`.

**Backend TODO:** we keep a month-long cookie instead of Supabase's refreshable session, and the server uses the service-role key for everything. If you want clients to talk to Supabase directly under RLS, switch to `@supabase/ssr` sessions and pass the user's JWT.

## 6. Payments and Premium

Plans live in `src/lib/billing/offers.ts` (identical in both repos): **Golden Executive Chef System** $100/yr founding price (regular $500), **The Golden Experience** $50/yr, both after a free 5-day trial (the "5-Day Zero-Waste Challenge") during which every feature is unlocked, whichever plan was chosen (`accessFor` in `src/lib/billing/entitlements.ts`; Whop and Google Play report it as `trialing`). Founding spots: `src/lib/billing/launch.ts` (counts paid `orders`), end date `NEXT_PUBLIC_LAUNCH_ENDS_AT`.

| Channel | Start | Confirm | Webhook / notifications |
|---|---|---|---|
| Web (Whop) | `startCheckout` → Whop embedded checkout, metadata `{ order_id, golden_user_id, offer }` | — | `POST /api/billing/whop/webhook` (Standard Webhooks signature, 5-min window) → `orders` paid + `subscriptions` |
| Android (Google Play) | `PlayBillingPlugin.java` → Google's purchase sheet, `obfuscatedAccountId` = Golden user id | `verifyPlayPurchase` checks with the Play Developer API, saves, acknowledges | `POST /api/billing/google/rtdn?token=…` re-reads each subscription from Google |
| Web (Stripe, legacy) | `/api/billing/stripe/checkout` | — | `POST /api/billing/stripe/webhook?entity=us|uk` (signature verified) |
| iOS | **no purchase flow yet** | — | `POST /api/billing/app-store/notifications` (JWS chain verified to Apple root) |

**Who is Premium:** `getViewer()` (`src/lib/viewer.ts`) asks `hasActiveSubscription(user.id)`: any row that is active, trialing, in grace, or cancelled but still inside its paid period. The signed `bac-plan` cookie is only the answer when Supabase isn't available (demo mode or an outage). Webhook endpoints return 503 when their secret isn't configured and 400/401 on a bad signature.

**Backend TODOs here:**
1. Whop static checkout links can't carry `golden_user_id`; memberships without it have only `whop_user_id`. Add a "link my purchase" step (match Whop email to account) before relying on static links.
2. iOS: add StoreKit purchases (or keep iPhone users on the web checkout, within App Store rules).
3. A Stripe/Whop customer-portal link on `/account`.
4. `hasActiveSubscription` runs on every page render that calls `getViewer` (Next caches the fetch for 30 s). Consider a `plan` column on `profiles` updated by the webhooks.

## 7. Server actions and API routes

| File | Exports | Notes |
|---|---|---|
| `actions/auth.ts` | `completeGoogleSignIn`, `requestEmailLink`, `demoSignIn`, `switchAccount`, `signOut` | sets/clears the signed session |
| `actions/viewer.ts` | `setSkill`, `chooseSkill`, `saveOnboarding`, `markJourneyDone`, `finishJourney`, `setDemoPlan` | skill/prefs are **cookies** today |
| `actions/checkout.ts` | `startCheckout` | Whop checkout + `orders` row |
| `actions/play.ts` | `verifyPlayPurchase` | Golden repo only |
| `actions/adapt.ts` | `adaptRecipeAction`, `fixMistakeAction` | Gemini rewrite with deterministic fallback |
| `actions/diagnose.ts` | `diagnoseDish`, `photoDiagnosisAvailable` | Fix My Mistake from a photo |
| `actions/import.ts` | `importRecipeAction` | import one page (SSRF-safe fetch)|
| `actions/community.ts` | `createPost`, `createReply` | |
| `actions/giveaway.ts` | `enterGiveaway` | |
| `actions/feedback.ts` | `sendFeedback` | |
| `api/billing/*` | webhooks above | always 2xx once handled so providers don't retry forever |

Domain logic worth knowing (all pure and unit-tested): `lib/skill/adapt.ts` (rewrites steps per level), `lib/timing/orchestrate.ts` (multi-dish timeline), `lib/recovery/` (Fix My Mistake maths), `lib/pantry.ts` (Pantry-to-Plate matching), `lib/import/*` (JSON-LD → recipe blocks), `lib/gamify.ts` (XP, ranks, streaks), `lib/search.ts`, `lib/feedback.ts`.

## 8. Data that still lives only on the device

These are the biggest backend jobs: today they're `localStorage`/cookies, so they don't follow a user to another phone.

| Key | What | Move to |
|---|---|---|
| `bac-skill`, `bac-prefs` (cookies) | level, household size, weeknight minutes, goals | `profiles` (table exists) |
| `bac-saved` | saved recipes | new `saved_recipes` |
| `bac-shopping` | shopping list | new `shopping_items` |
| `bac-pantry` | pantry | `pantry_items` (exists) |
| `bac-progress` | XP, streak, dishes cooked, Mini You avatar, kitchen log | new `progress` + `kitchen_log` |
| `bac-imports` | imported recipes | `imported_recipes` (exists, owner-only RLS) |
| `bac-timers` | running timers | `active_timers` (exists) |
| `bac-plan-done`, `bac-feedback` | meal-plan progress, feedback asked/sent | small tables or a JSON column on `profiles` |

Suggested order: profiles → progress (the feedback prompt and Today card depend on "dishes cooked") → saved/shopping/pantry → imports → timers. Keep the device copy as an offline cache and sync on sign-in.

## 9. Recipes and AI

- Catalogue = `src/lib/data/recipes.ts` (4 classics) + `real-time-recipes.ts` (6 originals with step pictures in `public/steps/`) + TheMealDB (live API, cached a day, plus `src/data/mealdb-recipes.json` built at deploy by `npm run data:mealdb`, gitignored).
- Search (`/explore?q=`): Golden's own recipes first, then TheMealDB. If nothing matches, the cook is offered an import from a link (private, like every import).
- Copyright rules (do not relax): imports are user-initiated, private and credited; never copy third-party recipes, photos or text into the repo.

## 10. Open items, in priority order

1. Production env: done for `SESSION_SECRET`, Supabase and Whop; migrations 0001–0007 have been run. **Run 0008 (`mealdb_meals`).** Still missing: see "Keys left for launch" below.
2. Move on-device data to Supabase (§8), starting with `profiles` and progress.
3. Whop account linking for static links (§6.1); customer portal link.
4. Rate limits on Gemini actions (`adaptRecipeAction`, `diagnoseDish`) and on `createPost`/`sendFeedback`.
5. Read recipes from Supabase (`recipes`/`recipe_blocks` are already seeded) so content can change without a deploy.
6. CI: add a GitHub Actions workflow running `npm run typecheck && npm run lint && npm test` on every PR.
7. Google Play: create the two subscriptions, service account and RTDN (`docs/SETUP.md` §3b), build the Android app in Android Studio and test with a licence tester. The Java plugin hasn't been compiled yet.
8. TheMealDB supporter key: set in Vercel but refused (404); confirm the key with TheMealDB. The full library (793 meals) is cached either way.
9. One codebase for both apps (golden + golden-v1), deployed twice.

## Keys left for launch (checked on Vercel, 11 Nov 2026)

Already set in Vercel (production): `SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_PLAN_EXECUTIVE`, `WHOP_PLAN_EXPERIENCE`, `WHOP_WEBHOOK_SECRET`, `GEMINI_MODEL`, `NEXT_PUBLIC_POSTHOG_HOST`, `MEALDB_API_KEY` (set, but refused by TheMealDB: confirm the key).

| Key | Needed | What happens without it |
|---|---|---|
| `GEMINI_API_KEY` | For the AI extras | Recipes rewrite with the built-in rules and Fix My Mistake works by tapping instead of from a photo. Nothing breaks. |
| `NEXT_PUBLIC_POSTHOG_KEY` | To measure the launch | No analytics are collected. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_RTDN_TOKEN` | Before the Android app goes on Google Play | Without them the app can't confirm Play purchases. Setup: `docs/SETUP.md` §3b. |
| `APPLE_BUNDLE_ID` | Only when iPhone purchases are added | App Store notifications are refused. |
| `STRIPE_US_*`, `STRIPE_UK_*` | Not needed | Whop is the web checkout. |

Not keys, but needed: Google sign-in switched on in Supabase (Auth → Providers) with the live site in the redirect URLs, and Whop's webhook pointing at `/api/billing/whop/webhook`.

## 11. Verified at handover

- `npm run typecheck`, `npm run lint`, `npm test` pass in both repos.
- `npm run build` (production) passes in both.
- Every page crawled in the production build, signed out and signed in (45 visits per app): no server errors, no browser errors, no broken internal links.
- Webhooks refuse unsigned or unconfigured requests.
- A forged sign-in or plan cookie is rejected (signed out / free plan); a real sign-in issues a signed, httpOnly cookie.
