# Golden

Recipes that adapt to your skill level, a hands-free cook mode with parallel timers, multi-dish timing, and "Fix My Mistake". Built with Next.js (App Router), React 19, Tailwind v4, TypeScript, Supabase, Gemini and Stripe.

See [CLAUDE.md](CLAUDE.md) for the architecture and the Mob-derived design decisions.

## Everything is in this repository

You (and anyone you add on GitHub) can run, change and ship Golden with ordinary tools, without
Claude Code or any AI subscription. Nothing lives outside the repo except your own accounts and
their secret keys.

| Where | What |
|---|---|
| `src/` | The whole app: pages (`src/app`), components, server actions, billing, AI fallbacks |
| `supabase/` | Database schema and migrations (`setup_all.sql` = all of them in order) |
| `android/`, `ios/`, `capacitor.config.ts`, `mobile/www` | The phone apps (Capacitor) |
| `public/` | Images, step pictures, brand icons |
| `design/brand/` | The original claw artwork and the scripts that make every icon |
| `docs/SETUP.md` | Step-by-step setup: Supabase, Google sign-in, Gemini, Whop, Google Play, Vercel, building the phone apps |
| `docs/BACKEND.md` | Backend handover: tables, environment variables, server actions, open items |
| `docs/MOBILE.md` | The phone apps |
| `CLAUDE.md` | Architecture and product rules (plain Markdown; useful to any developer) |
| `.env.example` | Every setting the app reads. The real values (keys, secrets) are kept in your Vercel project's Environment Variables and your Supabase, Whop and Google consoles, never in git. Keep your own copy of them somewhere safe. |

Typical workflow without Claude: edit in any editor (VS Code, Android Studio, Xcode), run the
checks below, commit and push to GitHub; Vercel deploys `main` automatically.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

No keys are needed: AI features fall back to the deterministic engines in `src/lib/`, and `/premium` offers a demo trial. Copy `.env.example` to `.env.local` to turn on Supabase, Gemini and Stripe.

## Check it

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Map

| Path | What |
|---|---|
| `/` | Discovery feed: segments → rails, category chips |
| `/recipes/[slug]` | Recipe with the skill slider |
| `/recipes/[slug]/cook` | Cook mode: one block at a time, timers, wake lock, Fix My Mistake |
| `/plan` | Multi-dish timing |
| `/onboarding` | Skill quiz |
| `/premium`, `/account` | 7-day trial, $45/year, billing |
| `src/lib/skill` | Module A: skill engine |
| `src/lib/recovery` | Module C: recovery maths |
| `src/lib/timing` | Module D: orchestration |
| `src/lib/billing` | Pricing, US/UK routing, Stripe, App Store, Google Play |
| `supabase/migrations` | Schema + RLS |
