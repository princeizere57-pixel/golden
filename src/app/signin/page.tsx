import type { Metadata } from "next";
import Link from "next/link";
import { switchAccount } from "@/app/actions/auth";
import { MiniYouFigure } from "@/components/mini-you";
import { SignInPanel } from "@/components/sign-in-panel";
import { Brand } from "@/components/site-chrome";
import { getUser, supabaseConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

/** Always shown after "Start leveling up". Already signed in? Continue, or switch accounts. */
export default async function SignInPage() {
  const user = await getUser();
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-8 pt-10">
      <div className="text-center"><Brand className="text-5xl" /></div>
      <div className="mt-8 flex justify-center"><MiniYouFigure mood="happy" size={130} /></div>
      <h1 className="mt-4 text-center font-display text-[2.2rem]">
        Let&apos;s set up <span className="text-accent">your kitchen</span>
      </h1>
      <p className="mt-3 text-center text-muted">Sign in with Google or your email, answer a few quick questions, and every recipe will be written for your level.</p>
      <div className="mt-auto pt-10">
        {user ? (
          <div className="rounded-3xl border border-line p-5 text-center">
            <p className="text-sm text-muted">You&apos;re signed in{user.provider === "google" ? " with Google" : user.provider === "demo" ? " (demo account)" : ""} as</p>
            <p className="mt-1 text-lg font-semibold">{user.email}</p>
            <Link href="/onboarding" className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Continue as {user.name.split(" ")[0]}</Link>
            <form action={switchAccount}>
              <button className="mt-2 min-h-12 w-full rounded-full border-2 border-line font-semibold">Use a different account</button>
            </form>
          </div>
        ) : (
          <SignInPanel supabaseUrl={supabaseConfigured() ? process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "") : null} />
        )}
      </div>
    </main>
  );
}
