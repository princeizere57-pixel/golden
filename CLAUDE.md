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
  - **Credit.** Always show the author and source with a link to the original; don't store or show the source's photos or videos.
  - `fetch.ts` blocks private/local addresses on every redirect (SSRF), caps size and time.

## 5. Monetisation and payment architecture (`src/lib/billing/`)

- **Pricing:** annual **$45.00/year** (anchored against **$7.99/month**). GBP prices are set separately (not converted on the fly).
- **Entity routing (US / UK):**
  - **US entity** (Stripe US / App Store): USD cards, Apple Pay, Google Pay. Stripe standard web pricing 2.9% + $0.30.
  - **UK entity** (UK Ltd / Stripe UK): GBP, domestic cards and Open Banking. UK domestic card pricing 1.5% + £0.20.
  - Customers are routed by **billing country**: GB → UK entity, everyone else → US entity. Each entity must be properly registered, collect tax where required and serve the customers routed to it. Fee figures are estimates for planning, not quotes.
- **Funnel:** 7-day free trial that auto-renews into the annual plan. App Store / Google Play small-business programmes (15% commission) apply to in-app purchases.
- **Webhooks:** Stripe (signature verified), App Store Server Notifications V2 (signed JWS, chain verified to the Apple root) and Google Play RTDN. All update `subscriptions` in Supabase.

## 6. Rules for working in this repo

- Run `npm run typecheck`, `npm run lint` and `npm test` before calling work done.
- Never call the network in tests; AI and payment code must take injectable clients or fall back.
- Secrets only come from environment variables (see `.env.example`); never commit keys.
- Don't copy third-party content (recipes, photos, videos, copy) into the repo. Seed data must be original.
- Accessibility: all interactive elements reachable by keyboard, visible focus, `prefers-reduced-motion` respected, minimum 44 px touch targets (64 px in cook mode).
