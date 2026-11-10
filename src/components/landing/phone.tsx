// iPhone mockups for the landing page, showing real screenshots of the Golden app
// (public/landing/*.png, captured from the running app at 390x844 @2x).
//
// Drawn like a real phone: titanium frame, a status bar (time, signal, Wi-Fi, battery) with the
// Dynamic Island in it, the app screenshot in between, and the home indicator bar at the bottom.
// The screenshot fills only the app area, not the whole glass.

import Image from "next/image";

export type Screen = "discover" | "plan" | "timeline" | "cook" | "fix" | "foryou";

const ALT: Record<Screen, string> = {
  discover: "Golden's Discover screen with collections picked for a Beginner cook",
  plan: "Plan a meal: two dishes timed to finish together",
  timeline: "The multi-dish timeline: one hands-on task at a time",
  cook: "Hands-free cook mode with the skill level slider",
  fix: "Fix My Mistake: snap the dish or tap what went wrong",
  foryou: "For you: the 5-Day Challenge, technique modules and Mini You",
};

function StatusBar() {
  return (
    <div className="relative flex h-[5.4%] shrink-0 items-center justify-between bg-white px-[8%] pt-[2%] text-[11px] font-semibold text-black" aria-hidden>
      <span className="tracking-tight">9:41</span>
      {/* Dynamic Island */}
      <span className="absolute left-1/2 top-[22%] h-[62%] w-[29%] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-[5px]">
        {/* Signal */}
        <svg viewBox="0 0 18 12" className="h-[9px]" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        {/* Wi-Fi */}
        <svg viewBox="0 0 16 12" className="h-[9px]" fill="currentColor"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.7 10.7 0 0 0 8 .4 10.7 10.7 0 0 0 .5 3.4l1.2 1.3A9 9 0 0 1 8 2.2z" /><path d="M8 5.6c1.5 0 2.9.6 4 1.6l1.2-1.3A7.4 7.4 0 0 0 8 3.8a7.4 7.4 0 0 0-5.2 2.1L4 7.2a5.7 5.7 0 0 1 4-1.6z" /><path d="M8 9c.6 0 1.2.2 1.6.6L8 11.4 6.4 9.6C6.8 9.2 7.4 9 8 9z" /></svg>
        {/* Battery */}
        <svg viewBox="0 0 27 12" className="h-[10px]"><rect x="0.5" y="0.5" width="23" height="11" rx="3.2" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" /><path d="M25 4v4c.8-.3 1.3-1.1 1.3-2S25.8 4.3 25 4z" fill="currentColor" opacity="0.45" /></svg>
      </span>
    </div>
  );
}

export function Phone({ screen, tilt = "right", className = "", priority = false }: { screen: Screen; tilt?: "left" | "right" | "none"; className?: string; priority?: boolean }) {
  const rotate = tilt === "right" ? "rotate-[8deg]" : tilt === "left" ? "-rotate-[8deg]" : "";
  return (
    <div className={`relative mx-auto w-[260px] ${rotate} ${className}`}>
      {/* Side buttons */}
      <span aria-hidden className="absolute -left-[3px] top-[18%] h-[6%] w-[3px] rounded-l bg-[#2c2c2e]" />
      <span aria-hidden className="absolute -left-[3px] top-[27%] h-[10%] w-[3px] rounded-l bg-[#2c2c2e]" />
      <span aria-hidden className="absolute -right-[3px] top-[24%] h-[14%] w-[3px] rounded-r bg-[#2c2c2e]" />
      <div className="rounded-[3rem] bg-gradient-to-b from-[#4a4a4e] via-[#2c2c2e] to-[#1c1c1e] p-[3px] shadow-[0_40px_80px_-20px_rgba(250,204,21,0.25)]">
        {/* Black bezel around the glass */}
        <div className="rounded-[2.85rem] bg-black p-[8px]">
          <div className="relative flex aspect-[393/852] flex-col overflow-hidden rounded-[2.3rem] bg-white">
            <StatusBar />
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <Image src={`/landing/${screen}.png`} alt={ALT[screen]} width={780} height={1688} sizes="290px" priority={priority} className="absolute inset-0 h-full w-full object-cover object-top" />
            </div>
            {/* Home indicator */}
            <div aria-hidden className="flex h-[3.6%] shrink-0 items-center justify-center bg-white">
              <span className="h-[5px] w-[36%] rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
