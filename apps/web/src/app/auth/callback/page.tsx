"use client";

// Supabase sends the browser back here after Google sign-in with the tokens in the URL hash.
// We hand the access token to the server, which verifies it before signing the user in.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { completeGoogleSignIn } from "@/app/actions/auth";
import { ClawMark } from "@/components/claw-loader";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access_token");
    // Clear the token from the address bar right away.
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setError(params.get("error_description") ?? "Google sign-in was cancelled.");
      return;
    }
    completeGoogleSignIn(token).then((r) => (r.ok ? router.replace("/onboarding") : setError(r.error ?? "Sign-in failed.")));
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      {error ? (
        <>
          <h1 className="font-display text-3xl">Sign-in didn&apos;t work</h1>
          <p className="mt-3 text-muted">{error}</p>
          <Link href="/signin" className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-button text-lg font-semibold text-button-ink">Try again</Link>
        </>
      ) : (
        <>
          <ClawMark size={96} />
          <h1 className="mt-6 font-display text-3xl">Signing you in…</h1>
        </>
      )}
    </main>
  );
}
