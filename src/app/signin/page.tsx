import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MiniYouFigure } from "@/components/mini-you";
import { SignInPanel } from "@/components/sign-in-panel";
import { Brand } from "@/components/site-chrome";
import { getUser, supabaseConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getUser()) redirect("/onboarding");
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-8 pt-10">
      <div className="text-center"><Brand className="text-base" /></div>
      <div className="mt-8 flex justify-center"><MiniYouFigure mood="happy" size={130} /></div>
      <h1 className="mt-4 text-center font-display text-[2.2rem]">
        Let&apos;s set up <span className="text-accent">your kitchen</span>
      </h1>
      <p className="mt-3 text-center text-muted">Sign in, answer a few quick questions, and every recipe will be written for your level.</p>
      <div className="mt-auto pt-10">
        <SignInPanel supabaseUrl={supabaseConfigured() ? process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "") : null} />
      </div>
    </main>
  );
}
