"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { track } from "@/lib/analytics";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// Where Better Auth sends the browser afterwards; failures (cancelled consent, expired link) get ?error=.
const AFTER = { callbackURL: "/onboarding", errorCallbackURL: "/auth/callback" };

/** "Continue with Google" or an emailed one-tap link, both through Better Auth on our API. */
export function SignInPanel() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function google() {
    setError(null);
    track("signin_started", { method: "google" });
    startTransition(async () => {
      // On success the client navigates to Google's consent screen.
      const { error } = await authClient.signIn.social({ provider: "google", ...AFTER });
      if (error) setError("Google sign-in isn't available right now. Try the email link instead.");
    });
  }

  function emailLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    track("signin_started", { method: "email" });
    startTransition(async () => {
      const { error } = await authClient.signIn.magicLink({ email: email.trim().toLowerCase(), ...AFTER });
      if (error) setError("We couldn't send the email. Check the address and try again in a minute.");
      else setSent(true);
    });
  }

  return (
    <div>
      <button onClick={google} disabled={pending} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full border-2 border-line bg-bg text-lg font-semibold disabled:opacity-60">
        <GoogleG /> Continue with Google
      </button>
      <div className="my-4 flex items-center gap-3 text-sm text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      {sent ? (
        <p role="status" className="rounded-2xl bg-accent-soft p-4 text-center">Check your inbox: we sent a sign-in link to <strong>{email}</strong>. Open it on this device.</p>
      ) : (
        <form onSubmit={emailLink} className="space-y-3">
          <label className="block text-sm font-medium">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line bg-bg px-3" placeholder="you@example.com" />
          </label>
          <button disabled={pending} className="min-h-14 w-full rounded-full bg-button text-lg font-semibold text-button-ink disabled:opacity-60">{pending ? "Sending…" : "Email me a sign-in link"}</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-tomato">{error}</p>}
      <p className="mt-4 text-center text-xs text-muted">By continuing you agree to our terms. We never post anything on your behalf.</p>
    </div>
  );
}
