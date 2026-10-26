# Be a Chef

Recipes that adapt to your skill level, a hands-free cook mode with parallel timers, multi-dish timing, and "Fix My Mistake". Built with Next.js (App Router), React 19, Tailwind v4, TypeScript, Supabase, Gemini and Stripe.

See [CLAUDE.md](CLAUDE.md) for the architecture and the Mob-derived design decisions.

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
