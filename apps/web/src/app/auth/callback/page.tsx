// Better Auth finishes sign-in itself (on /api/auth/callback/* or the magic-link verify) and sends
// the browser to /onboarding. This page only explains failures, which arrive as ?error=<code>.

import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AuthCallback({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) redirect("/onboarding");
  const message = /token|expired/i.test(error) ? "That sign-in link has expired or was already used." : "Sign-in was cancelled or didn't go through.";
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl">Sign-in didn&apos;t work</h1>
      <p className="mt-3 text-muted">{message}</p>
      <Link href="/signin" className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Try again</Link>
    </main>
  );
}
