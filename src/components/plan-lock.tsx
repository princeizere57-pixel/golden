// A feature the cook's plan doesn't include. It teaches what the feature does and offers the one
// plan that unlocks it (an empty state with a single action, like EmptyState).

import Link from "next/link";
import type { ReactNode } from "react";
import { FlameIcon, FridgeIcon, HatIcon, LifebuoyIcon, NotepadIcon, PanFireIcon, StopwatchIcon } from "@/components/icons-3d";
import { LOCKED_COPY, SHORT_NAME, planFor, type Feature } from "@/lib/billing/entitlements";

const ICON: Record<Feature, (size: number) => ReactNode> = {
  cookMode: (s) => <StopwatchIcon size={s} />,
  singleDishPlan: (s) => <PanFireIcon size={s} />,
  shoppingList: (s) => <NotepadIcon size={s} />,
  community: (s) => <HatIcon size={s} />,
  premiumRecipes: (s) => <HatIcon size={s} />,
  multiDish: (s) => <StopwatchIcon size={s} />,
  fixMyMistake: (s) => <LifebuoyIcon size={s} />,
  pantry: (s) => <FridgeIcon size={s} />,
  modules: (s) => <FlameIcon size={s} />,
  recipeWriter: (s) => <HatIcon size={s} />,
};

export const unlockHref = (feature: Feature) => `/checkout?plan=${planFor(feature)}`;

/** Full locked screen, or a compact card inside a page (`compact`). */
export function PlanLock({ feature, compact = false, back }: { feature: Feature; compact?: boolean; back?: { href: string; label: string } }) {
  const copy = LOCKED_COPY[feature];
  const plan = SHORT_NAME[planFor(feature)];
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-accent-soft p-4">
        <span aria-hidden className="shrink-0">{ICON[feature](44)}</span>
        <div className="flex-1">
          <p className="font-semibold">{copy.title} <span className="ml-1 rounded-full bg-button px-2 py-0.5 text-xs font-bold text-button-ink">{plan}</span></p>
          <p className="text-sm text-muted">{copy.text}</p>
        </div>
        <Link href={unlockHref(feature)} className="flex min-h-11 shrink-0 items-center rounded-full border-2 border-ink px-4 text-sm font-semibold">Unlock</Link>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <span aria-hidden>{ICON[feature](80)}</span>
      <p className="mt-3 rounded-full bg-button px-3 py-1 text-xs font-bold text-button-ink">Part of {plan}</p>
      <h2 className="mt-3 text-xl font-semibold">{copy.title}</h2>
      <p className="mt-1 max-w-xs text-muted">{copy.text}</p>
      <Link href={unlockHref(feature)} className="mt-5 flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-button px-6 font-semibold text-button-ink">
        Unlock with {plan}
      </Link>
      {back && <Link href={back.href} className="mt-2 flex min-h-11 items-center text-sm font-medium underline">{back.label}</Link>}
    </div>
  );
}

/** A whole page for a locked route (cook mode, Plan a meal…), with a way back. */
export function LockedPage({ feature, heading, back }: { feature: Feature; heading: string; back: { href: string; label: string } }) {
  return (
    <main className="mx-auto max-w-lg px-4 pb-10 pt-6">
      <h1 className="font-display text-[2rem]">{heading}</h1>
      <PlanLock feature={feature} back={back} />
    </main>
  );
}

/** The primary button for a feature the cook can't use yet: same place, honest label. */
export function UnlockButton({ feature, label }: { feature: Feature; label: string }) {
  return (
    <Link href={unlockHref(feature)} className="mt-6 flex min-h-14 flex-col items-center justify-center rounded-full bg-button font-semibold leading-tight text-button-ink">
      {label}
      <span className="text-xs font-medium">Part of {SHORT_NAME[planFor(feature)]} · 3 days free</span>
    </Link>
  );
}
