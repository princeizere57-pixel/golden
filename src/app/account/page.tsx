import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { setDemoPlan } from "@/app/actions/viewer";
import { getUser } from "@/lib/auth";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Account" };

const SKILL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ trial?: string }> }) {
  const { trial } = await searchParams;
  const [viewer, user] = await Promise.all([getViewer(), getUser()]);
  const stripeReady = Boolean(process.env.STRIPE_US_SECRET_KEY || process.env.STRIPE_UK_SECRET_KEY);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Account</h1>
      {trial === "started" && <p role="status" className="mt-4 rounded-2xl bg-basil p-4 text-white">Your free trial has started. Happy cooking!</p>}
      <dl className="mt-8 divide-y divide-line rounded-3xl border border-line bg-surface">
        {user && <Row label={user.provider === "google" ? "Signed in with Google" : "Signed in (demo)"} value={`${user.name} · ${user.email}`} action={null} />}
        <Row label="Skill level" value={SKILL_LABEL[viewer.skill]} action={<Link className="underline" href="/onboarding">Retake quiz</Link>} />
        <Row label="Plan" value={viewer.plan === "premium" ? "Premium" : "Free"} action={viewer.plan === "free" ? <Link className="underline" href="/checkout">Upgrade</Link> : null} />
      </dl>
      {viewer.plan === "premium" && (
        <section className="mt-8">
          <h2 className="font-bold">Manage subscription</h2>
          <p className="mt-1 text-sm text-muted">Web subscriptions are managed in the Stripe customer portal; in-app subscriptions in your App Store or Google Play settings.</p>
          {!stripeReady && (
            <form action={setDemoPlan.bind(null, "free")} className="mt-4">
              <button className="min-h-11 rounded-full border border-line px-5 font-semibold">Cancel demo trial</button>
            </form>
          )}
        </section>
      )}
      {user && (
        <form action={signOut} className="mt-10">
          <button className="min-h-12 rounded-full border border-line px-6 font-semibold">Sign out</button>
          <p className="mt-2 text-xs text-muted">Signing out also clears your level and answers on this device, so the questions start fresh next time.</p>
        </form>
      )}
    </main>
  );
}

function Row({ label, value, action }: { label: string; value: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div><dt className="text-sm text-muted">{label}</dt><dd className="text-lg font-semibold">{value}</dd></div>
      {action}
    </div>
  );
}
