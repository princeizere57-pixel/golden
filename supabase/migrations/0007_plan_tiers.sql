-- Which plan each subscription is for, so the app can unlock exactly what was bought
-- (src/lib/billing/entitlements.ts). Rows without one (older rows, Stripe, App Store) count as
-- Executive. Safe to run more than once.
alter table subscriptions add column if not exists offer text
  check (offer is null or offer in ('executive', 'experience'));
