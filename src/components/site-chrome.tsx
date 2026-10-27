"use client";

// Header on wide screens, bottom tab bar on phones. Hidden on the full-screen welcome and
// onboarding flows; the tab bar is also hidden in cook mode.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShopping } from "@/components/recipe-actions";

const FULL_SCREEN = /^\/(welcome|onboarding)(\/|$)/;
const COOK = /\/cook$/;

const TABS = [
  { href: "/", label: "Discover", icon: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.2-4.2" },
  { href: "/for-you", label: "For you", icon: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm-2 5.5v7l6-3.5z" },
  { href: "/shopping", label: "Shopping list", icon: "M7 3h10l2 2v16H5V5zM9 9h6M9 13h6M9 17h4" },
  { href: "/saved", label: "Saved", icon: "M6 4h12v17l-6-4-6 4z" },
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
              <Link href={tab.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-ink" : "text-muted"}`}>
                <span className="relative">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={tab.icon} />
                  </svg>
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
