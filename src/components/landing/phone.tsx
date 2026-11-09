// iPhone mockups for the landing page, showing real screenshots of the Golden app
// (public/landing/*.png, captured from the running app at 390x844 @2x).

import Image from "next/image";

export type Screen = "discover" | "plan" | "timeline" | "cook" | "fix" | "foryou";

const ALT: Record<Screen, string> = {
  discover: "Golden's Discover screen with collections picked for a Beginner cook",
  plan: "Plan a meal: two dishes timed to finish together",
  timeline: "The multi-dish timeline: one hands-on task at a time",
  cook: "Hands-free cook mode with the skill level slider",
  fix: "Fix My Mistake: snap the dish or tap what went wrong",
  foryou: "For you: the 3-Day Challenge, technique modules and Mini You",
};

export function Phone({ screen, tilt = "right", className = "", priority = false }: { screen: Screen; tilt?: "left" | "right" | "none"; className?: string; priority?: boolean }) {
  const rotate = tilt === "right" ? "rotate-[8deg]" : tilt === "left" ? "-rotate-[8deg]" : "";
  return (
    <div className={`relative mx-auto w-[260px] sm:w-[290px] ${rotate} ${className}`}>
      <div className="rounded-[3rem] bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] p-[10px] shadow-[0_40px_80px_-20px_rgba(250,204,21,0.25)]">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-white">
          <Image src={`/landing/${screen}.png`} alt={ALT[screen]} width={780} height={1688} sizes="290px" priority={priority} className="block h-auto w-full" />        </div>
      </div>
    </div>
  );
}
