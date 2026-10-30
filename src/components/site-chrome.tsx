"use client";

// Header on wide screens, bottom tab bar on phones. Hidden on the full-screen welcome and
// onboarding flows; the tab bar is also hidden in cook mode.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LensIcon, NotepadIcon, SackIcon, SteamingDishIcon } from "@/components/icons-3d";
import { MiniYou } from "@/components/mini-you";
import { useShopping } from "@/components/recipe-actions";

const FULL_SCREEN = /^\/(welcome|onboarding)(\/|$)/;
const COOK = /\/cook$/;

const TABS = [
  { href: "/", label: "Discover", Icon: LensIcon },
  { href: "/for-you", label: "For you", Icon: SteamingDishIcon },
  { href: "/shopping", label: "Shopping list", Icon: NotepadIcon },
  { href: "/saved", label: "Saved", Icon: SackIcon },
];

export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl ${className}`}>
      The Chef&apos;s <span className="text-accent">AI</span>
    </span>
  );
}

/** Tab pages carry their own big title on phones, so the header only shows there on wide screens. */
const TAB_PAGES = /^\/(for-you|shopping|saved)?$/;

export function SiteHeader() {
  const path = usePathname();
  if (FULL_SCREEN.test(path)) return null;
  return (
    <header className={`sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur ${TAB_PAGES.test(path) ? "hidden lg:block" : ""}`}>
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3" aria-label="Main">
        <Link href="/"><Brand /></Link>
        <div className="ml-auto hidden items-center gap-1 text-sm font-medium lg:flex">
          <Link href="/explore" className="rounded-full px-3 py-2.5 hover:bg-surface">Explore</Link>
          <Link href="/for-you" className="rounded-full px-3 py-2.5 hover:bg-surface">For you</Link>
          <Link href="/shopping" className="rounded-full px-3 py-2.5 hover:bg-surface">Shopping list</Link>
          <Link href="/saved" className="rounded-full px-3 py-2.5 hover:bg-surface">Saved</Link>
          <Link href="/import" className="rounded-full px-3 py-2.5 hover:bg-surface">Import</Link>
          <Link href="/plan" className="rounded-full px-3 py-2.5 hover:bg-surface">Plan a meal</Link>
          <Link href="/account" className="rounded-full px-3 py-2.5 hover:bg-surface">Account</Link>
        </div>
        <Link href="/premium" className="ml-auto rounded-full bg-button px-4 py-2.5 text-sm font-semibold text-button-ink lg:ml-2">Try free</Link>
        <Link href="/you" aria-label="Mini You and your progress" className="overflow-hidden rounded-full bg-accent-soft"><MiniYou headOnly size={42} /></Link>
      </nav>
    </header>
  );
}

/** Floating pill tab bar (phones and tablets). */
export function TabBar() {
  const path = usePathname();
  const toBuy = useShopping().filter((i) => !i.done).length;
  if (FULL_SCREEN.test(path) || COOK.test(path)) return null;
  return (
    <nav aria-label="Tabs" className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-lg rounded-[1.75rem] border border-line bg-bg/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md mb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? path === "/" || path.startsWith("/explore") : path.startsWith(tab.href);
          const badge = tab.href === "/shopping" && toBuy > 0 ? toBuy : 0;
          return (
            <li key={tab.href}>
              <Link href={tab.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "font-semibold text-ink" : "font-medium text-muted"}`}>
                <span className={`relative transition-transform duration-200 ${active ? "-translate-y-0.5 scale-110" : "opacity-75 saturate-[.6]"}`}>
                  <tab.Icon size={34} />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-basil px-1 text-[10px] font-bold text-white" aria-label={`${badge} to buy`}>{badge > 99 ? "99+" : badge}</span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
