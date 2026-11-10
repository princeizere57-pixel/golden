# Project: Be a Chef — AI Culinary Coaching & Execution Platform

*Codename:* Be a Chef (Mob-inspired discovery + OneKit-style execution)

Claude Code reads this file for architecture rules, stack choices and feature constraints. Keep it current when the architecture changes.

## 1. Core product concept

An AI cooking app and web platform that moves the focus from static recipe lists to **real-time skill adaptation**, **step-by-step execution coaching** and **multi-dish timing orchestration**.

Users don't just read recipes: they pick a skill level (beginner, intermediate or chef), the instructions are rewritten for that level, a cook mode walks them through one block at a time with parallel timers, and "Fix My Mistake" rescues common failures with exact pantry maths.

## 2. Technical stack (TypeScript everywhere)

- **Language:** TypeScript in strict mode for all app, server and test code. No plain `.js` source files. Shared domain types live in `src/lib/types.ts` and are the single source of truth.
- **Frontend:** Next.js (App Router, React Server Components first; `"use client"` only where interaction needs it), React 19, Tailwind CSS v4.
  - **Discovery (Mob-inspired):** full-bleed media cards, muted autoplaying loops (only when on screen), horizontal "rails" and category chips.
  - **Execution (OneKit-inspired):** modular step blocks, parallel countdown timers, large touch targets, and a high-contrast hands-free cook mode that keeps the screen awake.
- **Component system:** OneKit-inspired design tokens (`src/app/globals.css`) and atomic step blocks: `IngredientPrepBlock`, `HeatControlBlock`, `TimingBlock`.
- **AI engine:** Gemini API (REST, server-only) for instruction rewriting, substitution maths and "Fix My Mistake". Every AI feature **must** have a deterministic fallback in `src/lib/` so the app works without a key and tests never call the network.
- **Database and state:** Supabase / PostgreSQL. Tracks profiles (skill level, plan, billing region), pantry, active timers, home segments and subscriptions. Schema and row-level security live in `supabase/migrations/`.
- **Billing:** Stripe web checkout through two entities (US and UK) plus Apple App Store and Google Play in-app purchases.

## 3. What we took from Mob (REA analysis) and how we changed it

REA (`rea-agents`) was used to study Mob's public website (mob.co.uk): its route manifest, page data shapes and script origins. **We reuse ideas, never Mob's code, content, images or branding.**

| Mob (observed) | Be a Chef (our version) |
|---|---|
| Next.js Pages Router on Vercel | Next.js **App Router**, Server Components first |
| Headless Craft CMS (sections, entry types, `uri`, SEOmatic) | **Supabase/Postgres** tables; recipes and the skill engine share one database |
| Home page = ordered **segments** (`rail`, `newRecipes`, `savedRecipes`) each with a `visibility` rule | Same data-driven **segment builder** (`src/lib/discovery/segments.ts`); visibility targets **plan *and* skill level** |
| Content shown per plan (`showForUserPlan`, `whoShouldSeeThis`) | `Visibility { plans?, skills? }` on segments and premium recipes |
| Discovery by category groups, chefs, collections, dietary requirements | Same dimensions plus **skill level** and **total active time** |
| Premium funnel (`/premium`, staged pages, `/onboarding/*`, `/account/cancel`, `/account/update-payment`) | `/premium` (7-day trial), onboarding with a **skill quiz**, `/account` billing |
| "Colourways" (named background/text colour pairs) | Design tokens + per-recipe `colourway` |
| Static recipe steps | **Adaptive OneKit blocks** rewritten per skill level, with timers and recovery |

## 4. Core architectural modules

### Module A — Skill-level engine (`src/lib/skill/`)
- Every recipe accepts `skill: "beginner" | "intermediate" | "chef"`.
- `adaptRecipe(recipe, skill)` is pure and deterministic:
  - **Beginner:** micro-steps, explicit sensory cues ("until the edges turn golden, ~4 min"), jargon defined inline.
  - **Intermediate:** standard professional shorthand plus parallel multi-dish timing alerts.
  - **Chef:** technique-forward wording, reduction targets and flavour/chemistry notes.
- `src/app/actions/adapt.ts` (server action) asks Gemini to rewrite the text in the same structure and validates the JSON. Any failure falls back to the deterministic result.

### Module B — Mob + OneKit hybrid UI
- **Discovery feed (`/`):** segments rendered as rails; horizontal category filter chips; media cards that loop video only while visible and respect reduced motion.
- **Execution view (`/recipes/[slug]/cook`):** one block at a time, big Back/Next targets (min 64 px), parallel timers that survive navigation, screen wake lock, high contrast.

### Module C — "Fix My Mistake" recovery (`src/lib/recovery/`)
- A floating assistant during cook mode.
- A deterministic catalogue with real kitchen maths (over-salting dilution, broken emulsions, burnt garlic, too spicy, sauce too thin/thick, overcooked pasta), scaled to the recipe's quantities. Gemini can add context-specific advice on top.

### Module D — Multi-dish timing orchestration (`src/lib/timing/`)
- Schedules several dishes so they finish together, respecting the cook's attention (only one *active* task at a time; *passive* tasks like simmering run in parallel).

### Module E — Personal recipe import (`src/lib/import/`, `/import`, `/my/[slug]`)
- A user pastes a link to a recipe page on any site (Mob included). The server fetches **that one page**, reads its schema.org `Recipe` JSON-LD (`parse.ts`) and converts the steps into OneKit blocks (`to-blocks.ts`: heat, timings, hands-off steps, "until…" cues, glossary terms), so the skill engine, cook mode and Fix My Mistake all work on it.
- Rules (do not relax):
  - **User-initiated only.** No crawling, bulk import, scheduled fetching or pre-importing.
  - **Private.** Imports are stored per user (on-device now; `imported_recipes` with owner-only RLS once accounts exist). Never add them to `RECIPES`, seed data, `segments`, the public feed, search or sharing.
  - **Credit.** Always show the author and source with a link to the original.
  - **Photos.** The private import view may show the source's own finished-dish photo, loaded from the source's URL with a "Photo: <source>" credit (`SourcePhoto`, plain `<img>`). Never download, cache, proxy (`next/image`) or re-host it, and never use source photos on our own recipes, the feed or marketing.
  - `fetch.ts` blocks private/local addresses on every redirect (SSRF), caps size and time.

### Module F — TheMealDB library (`src/lib/mealdb/`, `/explore`, `/meals/[id]`)
- Public recipe API (search, categories, lookup) converted to our `Recipe` shape by `convert.ts`, reusing the import pipeline (`parseIngredient`, `stepToBlock`), so every meal gets the skill slider, cook mode, timers and Fix My Mistake. Slugs are `mealdb-<id>`; `findRecipe()` resolves them for server actions.
- Responses cached for a day (`next.revalidate`). Photos load from TheMealDB's CDN (`/medium` 350 px variant in lists).
- **Local bulk cache:** `npm run data:mealdb` (`scripts/seed-mealdb.mts`) fetches full recipes letter by letter (`search.php?f=a`…, a–f in parallel, more letters until ≥100), de-duplicates and writes `src/data/mealdb-recipes.json`. `cache.ts` serves meal lookups from it before calling the API. The file is gitignored: regenerate it, don't commit it.
- **Licence:** `MEALDB_API_KEY` empty = shared test key `1`, development only. A public or app-store release requires a TheMealDB supporter key. Always credit TheMealDB and link to the meal.

## 5. Monetisation and payment architecture (`src/lib/billing/`)

- **Pricing (both repos, `src/lib/billing/offers.ts`, keep identical):** **Golden Year $45.09/year** (best value, $3.76/month) and **Golden Monthly $7.99/month**, both with **3 days free** (Whop plans `WHOP_PLAN_YEAR`, `WHOP_PLAN_MONTH`). golden-v1's landing page shows the same two plans (no founding-price discount). GBP prices are set separately (not converted on the fly).
- **Entity routing (US / UK):**
  - **US entity** (Stripe US / App Store): USD cards, Apple Pay, Google Pay. Stripe standard web pricing 2.9% + $0.30.
  - **UK entity** (UK Ltd / Stripe UK): GBP, domestic cards and Open Banking. UK domestic card pricing 1.5% + £0.20.
  - Customers are routed by **billing country**: GB → UK entity, everyone else → US entity. Each entity must be properly registered, collect tax where required and serve the customers routed to it. Fee figures are estimates for planning, not quotes.
- **Funnel:** 3-day free trial that auto-renews into the chosen plan. App Store / Google Play small-business programmes (15% commission) apply to in-app purchases.
- **Webhooks:** Stripe (signature verified), App Store Server Notifications V2 (signed JWS, chain verified to the Apple root) and Google Play RTDN. All update `subscriptions` in Supabase.

## 6. Rules for working in this repo

- Run `npm run typecheck`, `npm run lint` and `npm test` before calling work done.
- Never call the network in tests; AI and payment code must take injectable clients or fall back.
- Secrets only come from environment variables (see `.env.example`); never commit keys.
- Don't copy third-party content (recipes, photos, videos, copy) into the repo. Seed data must be original.
- Accessibility: all interactive elements reachable by keyboard, visible focus, `prefers-reduced-motion` respected, minimum 44 px touch targets (64 px in cook mode).

## 7. Look and flow (Mob-inspired, skill-anchored)

The interface follows the editorial pattern seen in Mob's app, re-done with our own copy, questions and logic. Never copy Mob's wording, fonts, logo or images.
- **Theme** (`globals.css`): white page, near-black ink, orange `--accent` for the highlighted word in headlines, yellow pill buttons (`bg-button text-button-ink`: `--button` #facc15 with dark text), rounded option cards. Headlines use `.font-display` (Archivo, black weight, wide). Cook mode keeps its own high-contrast theme.
- **First run:** `/welcome` → `/signin` (Google via Supabase OAuth, token verified server-side in `src/lib/auth.ts`; labelled demo sign-in when Supabase keys are absent) → `/onboarding` (Mini You greets you by name, then the questions) → `/checkout` (plan choice, $0 due today, trial end date; Stripe when configured). `/` requires sign-in and a level. Previously: `/welcome` → `/onboarding` (`onboarding-flow.tsx`): one question per screen with progress bar, back and close. Questions and scoring live in `src/lib/skill/quiz.ts`: confidence + techniques decide the level; household and time become prefs (`bac-prefs` cookie). Then a "building your skill path" step, the level result, and the 7-day trial offer. `/` redirects to `/welcome` until a level is set.
- **Tabs** (`site-chrome.tsx`): floating pill tab bar on every screen size (Discover, For you, Shopping list with a to-buy badge, Saved); header links on wide screens.
- **Discover** (`/`): big title, sticky search, quick photo tiles, collections pitched per level, NEW rail, "Right at your level", dish of the day with Share, time-limited rail from prefs, review prompt after 3 visits. Built from `src/lib/library.ts` (seed + local TheMealDB cache).
- **For you** (`/for-you`): a technique path per level with practice recipes, then a "next level" rail.
- **Saved / Shopping list:** on-device (`src/lib/device-store.ts`) until accounts exist; Save and Add-to-list buttons on recipe and meal pages.

## 8. Our own identity: 3D icons, Mini You and the game layer

These set The Chef's AI apart; keep them original (no third-party mascots, icon sets or artwork).
- **3D icons** (`src/components/icons-3d.tsx`): hand-built SVG with gradients, highlight and contact shadow. Tabs: Discover = lens, For you = steaming dish, Shopping list = yellow notepad with black pen, Saved = blue sack with a plastic clip. Log icons: hat, lifebuoy, trophy, flame.
- **Mini You** (`mini-you.tsx`): a drawn cartoon chef, girl or boy, white hat and jacket. Moods: neutral, focused (cook mode), happy (dish finished, mistake fixed), proud (rank-up), sad (Fix My Mistake opened). Moods fade after 6 h.
- **Game layer** (`src/lib/gamify.ts`, pure and tested; state in `progress-store.ts`, on-device): XP (cooked +50, fixed +15), chef ranks Kitchen Porter → Head Chef, day streaks. Cook mode's "I made it!" shows a celebration with XP, streak and rank progress.
- **Kitchen log** (`kitchen-log.tsx`): activity cards (3D icon, **Title** · detail, photo, green tick) with Mini You commenting on top. Shown on For you and `/you`.

## 9. Whop checkout

- `/checkout` sends buyers to Whop's hosted checkout when `WHOP_CHECKOUT_URL_YEAR` / `WHOP_CHECKOUT_URL_MONTH` are set (links copied from the Whop dashboard); otherwise Stripe if configured, otherwise a labelled demo. Signed-in Premium users see a "You're on Premium" screen instead of a redirect.
- `/api/billing/whop/webhook` verifies Whop's Standard Webhooks signature (`webhook-id`, `webhook-timestamp`, `webhook-signature: v1,<base64>`; HMAC-SHA256 over `id.timestamp.body`; 5-minute window) with `WHOP_WEBHOOK_SECRET`, then maps the membership status (`src/lib/billing/whop.ts`) into `subscriptions` with `provider = 'whop'` and `whop_user_id` (migration 0003).
- Linking a Whop membership to an app account uses `metadata.app_user_id` when present; otherwise match on `whop_user_id`. Static checkout links can't carry our user ID, so confirm the account match before granting Premium in production.

## 10. Brand, gate, Mini You camera, email sign-in, analytics

- **Name:** Golden (large wordmark via `<Brand className="text-…">`); "Gold" uses `.text-gold` (metallic gradient), "en" stays ink.
- **Gate:** `src/middleware.ts` + `src/lib/journey.ts`. Until the journey is done, `/` itself serves the welcome page (rewrite, address stays the bare site URL) and every page except `/welcome`, `/signin`, `/auth/*`, `/onboarding`, `/checkout`, `/api/*` redirects to `/welcome` until the `bac-journey` cookie is set, which `markJourneyDone()` only does for a signed-in user with a level (checkout: trial started or "Not now"). Sign out clears it.
- **After the questions:** onboarding shows a "what Golden fixes" screen before the skill-path step (`PROBLEMS` in `onboarding-flow.tsx`): everyday problem → the Golden feature that solves it, with 3D icons (`FridgeIcon`, `StopwatchIcon` added). No made-up user statistics. The welcome page no longer has its own problems, comparison or giveaway sections (/giveaway still exists).
- **Mini You:** drawn SVG chef, girl or boy (`FigurePicker` in onboarding and `/you`). The girl has voluminous curls, lashes, a rosy grin and gold earrings. No photos, camera or AI image generation.
- **Email sign-in:** Supabase magic link (`sendMagicLink`) returning to `/auth/callback`.
- **Analytics:** `src/lib/analytics.ts` (PostHog capture API, no-op without `NEXT_PUBLIC_POSTHOG_KEY`, honours Do Not Track) + `PageViews`.
- **Tabs:** Discover, For you, Plan a meal (pan on fire), Shopping list, Saved.
- Setup steps for Supabase, Google, Gemini, Whop, analytics and Vercel: `docs/SETUP.md`.

## 11. Plan a meal (recipe-first flow)

- `/plan` (bottom tab): pick a dish rated for the cook's level from seeds + the TheMealDB library; `/plan?dish=a&dish=b` (up to 4) shows, in order: video (YouTube, privacy-enhanced, loads on tap), ingredient pills with TheMealDB ingredient pictures (`src/lib/ingredient-icons.ts`, pantry items marked), the orchestrated timeline with chimes/vibration (`MealPlanner`), "Cooking more than one dish?" add-ons, the skill-adapted method per dish, then the inline `FixPanel`.
- `FixPanel`: optional photo (shrunk to 512 px in the browser, never stored); with `GEMINI_API_KEY`, `src/lib/ai/diagnose.ts` asks Gemini to pick the closest problem from `MISTAKES`; the fix itself always comes from `src/lib/recovery/fixes.ts`. Without a key the cook taps what they see.
- Recipe and meal pages have "Plan & cook this".
- Gate: the app opens once signed in + a level (`journeyComplete`), so leaving checkout another way no longer locks people out.

## 12. Real-time recipes

- `src/lib/data/real-time-recipes.ts`: original Golden recipes (`realTime: true`, chef "Golden Kitchen") that start the slow part first and fill the waiting time with prep, sauces and washing-up. Never copy recipes or wording from cookbooks; write them from scratch.
- A block's `during: "<id>"` marks a step done while an earlier passive block runs. `elapsedMinutes()` (`src/lib/links.ts`) doesn't count it, and `recipeTasks()` (`src/lib/timing/orchestrate.ts`) folds it into the host step's timeline line ("Meanwhile: …").
- Discover has a "Real-time cooking: prep while it cooks" rail. Recipes without a photo show `TimeTile` (3D stopwatch with the cooking time beside it) on Discover and Plan a meal, never a black square. The running meal timeline is a light card with the stopwatch beside the countdown.
- Step pictures: transparent 512 px WebPs in `public/steps/<slug>/<step>.webp`, listed in `src/lib/data/step-pictures.ts` and attached as `block.picture`. Shown beside each step (`StepPicture` in `skill-steps.tsx`) and large in cook mode. AI-generated for Golden (Higgsfield), background removed; `tests/step-pictures.test.ts` checks every listed file exists.
- Supabase: `supabase/migrations/0005_seed_recipes.sql` (also in `setup_all.sql`) upserts every seed recipe and its blocks, plus a `real_time` column. It is generated by `src/lib/data/recipes-sql.ts`; after editing recipes run `UPDATE_SQL=1 npx vitest run tests/recipes-sql.test.ts`. The test fails if the SQL drifts from the code.

## 13. UX rules (apply to every new screen, both repos)

- **One primary action per screen**, in the yellow pill; everything else is secondary (outline or text). On recipe pages that's "Start cook mode", then "Plan & cook this", then Save / Add to list.
- **Habit loop on Discover** (`TodayCard`): a cue (greeting + streak), one action (tonight's real-time pick: Start cooking / Plan it) and the reward in view (rank progress bar). Don't stack two dark cards; secondary promos use `bg-accent-soft`.
- **Empty states teach the next step** (`EmptyState`: 3D icon, short title, one sentence, one button). Never just "nothing here".
- **Decision first, extras after:** checkout shows level benefits → plan choice → payment, then the giveaway.
- **Feedback on every tap:** buttons and links press in slightly (`globals.css`, off under reduced motion). Visible focus ring everywhere.
- **Focus while cooking:** no upsell in the header in cook mode; controls on the dark theme need visible borders.
- **Honest persuasion:** no fake scarcity, countdowns or made-up statistics; any figure needs a source.
