"use client";

// Header on wide screens, bottom tab bar on phones. Hidden on the full-screen welcome and
// onboarding flows; the tab bar is also hidden in cook mode.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LensIcon, NotepadIcon, PanFireIcon, SackIcon, SteamingDishIcon } from "@/components/icons-3d";
import { MiniYou } from "@/components/mini-you";
import { useShopping } from "@/components/recipe-actions";

const FULL_SCREEN = /^\/(welcome|onboarding|signin|auth|checkout)(\/|$)/;
const COOK = /\/cook$/;

const TABS = [
  { href: "/", label: "Discover", Icon: LensIcon },
  { href: "/for-you", label: "For you", Icon: SteamingDishIcon },
  { href: "/plan", label: "Plan a meal", Icon: PanFireIcon },
  { href: "/shopping", label: "Shopping list", Icon: NotepadIcon },
  { href: "/saved", label: "Saved", Icon: SackIcon },
];

export function Brand({ className = "text-3xl" }: { className?: string }) {
  return (
    <span className={`font-sans font-bold leading-none tracking-tight ${className}`}>
      <span className="text-gold">Gold</span>en
    </span>
  );
}

/** Tab pages carry their own big title on phones, so the header only shows there on wide screens. */
const TAB_PAGES = /^\/(for-you|shopping|saved|plan)?$/;

export function SiteHeader({ welcomeAtRoot = false }: { welcomeAtRoot?: boolean }) {
  const path = usePathname();
  if (FULL_SCREEN.test(path) || (welcomeAtRoot && path === "/")) return null;
  return (
    <header className={`sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur ${TAB_PAGES.test(path) ? "hidden" : ""}`}>
      <nav className="mx-auto flex items-center gap-4 px-4 py-3" aria-label="Main">
        <Link href="/"><Brand /></Link>
        {COOK.test(path) ? <span className="ml-auto" /> : <Link href="/checkout" className="ml-auto rounded-full bg-button px-4 py-2.5 text-sm font-semibold text-button-ink">Try free</Link>}
        <Link href="/you" aria-label="Mini You and your progress" className="overflow-hidden rounded-full bg-accent-soft"><MiniYou headOnly size={42} /></Link>
      </nav>
    </header>
  );
}

/** Floating pill tab bar, on every screen size. */
export function TabBar({ welcomeAtRoot = false }: { welcomeAtRoot?: boolean }) {
  const path = usePathname();
  const toBuy = useShopping().filter((i) => !i.done).length;
  if (FULL_SCREEN.test(path) || COOK.test(path) || (welcomeAtRoot && path === "/")) return null;
  return (
    <nav aria-label="Tabs" className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-[456px] rounded-[1.75rem] border border-line bg-bg/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md mb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
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
