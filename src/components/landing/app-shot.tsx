// A real Golden app screenshot (public/landing/*.png, 390x844 @2x) in the app's yellow phone frame.

import Image from "next/image";

export type Screen = "discover" | "plan" | "timeline" | "cook" | "fix" | "foryou";

const ALT: Record<Screen, string> = {
  discover: "Golden's Discover screen with collections picked for a Beginner cook",
  plan: "Plan a meal with two dishes, timed to finish together",
  timeline: "The multi-dish timeline: one hands-on task at a time",
  cook: "Hands-free cook mode with the skill level slider",
  fix: "Fix My Mistake: snap the dish or tap what went wrong",
  foryou: "For you: the 3-Day Challenge, technique modules and Mini You",
};

export function AppShot({ screen, tilt = 0, className = "", priority = false }: { screen: Screen; tilt?: number; className?: string; priority?: boolean }) {
  return (
    <div className={`mx-auto w-[15.5rem] sm:w-[17rem] ${className}`} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      <div className="overflow-hidden rounded-[2.4rem] border-[7px] border-button bg-bg shadow-2xl">
        <Image src={`/landing/${screen}.png`} alt={ALT[screen]} width={780} height={1688} sizes="(min-width: 640px) 272px, 248px" priority={priority} className="block h-auto w-full" />
      </div>
    </div>
  );
}
