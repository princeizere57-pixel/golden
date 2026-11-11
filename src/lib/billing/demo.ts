// Demo payments: a pretend free trial for local development and previews without real accounts.
// Only allowed when there are no real accounts (Supabase not configured) and no Stripe keys, so
// on the live site nobody can give themselves a plan by calling the demo action.

import { supabaseConfigured } from "@/lib/auth";

export const demoPaymentsAllowed = () =>
  !supabaseConfigured() && !process.env.STRIPE_US_SECRET_KEY && !process.env.STRIPE_UK_SECRET_KEY;
