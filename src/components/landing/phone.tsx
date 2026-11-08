// Drawn phone mockups for the landing page: real Golden screens in miniature, no screenshots.

import type { ReactNode } from "react";

export function Phone({ children, tilt = "right", className = "" }: { children: ReactNode; tilt?: "left" | "right" | "none"; className?: string }) {
  const rotate = tilt === "right" ? "rotate-[8deg]" : tilt === "left" ? "-rotate-[8deg]" : "";
  return (
    <div aria-hidden className={`relative mx-auto w-[260px] sm:w-[290px] ${rotate} ${className}`}>
      <div className="rounded-[3rem] bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] p-[10px] shadow-[0_40px_80px_-20px_rgba(250,204,21,0.25)]">
        <div className="relative min-h-[540px] overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#17140c] via-[#0b0a07] to-black px-4 pb-6 pt-3 text-white">
          <div className="flex items-center justify-between px-3 text-[11px] font-semibold">
            <span>7:00</span>
            <span className="h-6 w-24 rounded-full bg-black" />
            <span>100%</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const Gold = ({ children }: { children: ReactNode }) => <span className="text-[#facc15]">{children}</span>;

export function TimelineScreen() {
  const rows = [
    { dish: "Seared steak", start: 46, width: 34, at: "7:16" },
    { dish: "Crispy potatoes", start: 0, width: 80, at: "7:00" },
    { dish: "Garlic green beans", start: 56, width: 24, at: "7:21" },
  ];
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-widest text-white/50">Tonight · 3 dishes</p>
      <p className="mt-1 text-2xl font-bold">Everything lands at <Gold>7:30</Gold></p>
      <div className="mt-5 space-y-4">
        {rows.map((r) => (
          <div key={r.dish}>
            <div className="flex justify-between text-xs"><span>{r.dish}</span><span className="text-white/50">start {r.at}</span></div>
            <div className="mt-1.5 h-3 rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-gradient-to-r from-[#a6761d] via-[#facc15] to-[#fbe7a1]" style={{ marginLeft: `${r.start}%`, width: `${r.width}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[#facc15]/30 bg-[#facc15]/10 p-3 text-sm">
        <p className="font-semibold"><Gold>Now:</Gold> potatoes into the oven</p>
        <p className="mt-0.5 text-white/60">Next chime in 16 min: steak pan on high</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
        {[["30", "min total"], ["1", "task at a time"], ["0", "cold plates"]].map(([n, l]) => (
          <div key={l} className="rounded-xl bg-white/5 py-2"><span className="block text-lg font-bold">{n}</span><span className="text-white/50">{l}</span></div>
        ))}
      </div>
    </div>
  );
}

export function DoctorScreen() {
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-widest text-white/50">Fix My Mistake</p>
      <p className="mt-1 text-2xl font-bold">What went <Gold>wrong?</Gold></p>
      <div className="mt-4 h-32 rounded-2xl bg-[radial-gradient(circle_at_40%_40%,#b4532a,#5a2410_60%,#2a1208)]" />
      <p className="mt-2 text-xs text-white/50">Photo checked: sauce looks over-salted</p>
      <div className="mt-4 space-y-2 text-sm">
        {["Add 120 ml unsalted stock", "Stir in 1 tsp lemon juice", "Simmer 1 minute, then taste"].map((s, i) => (
          <p key={s} className="flex gap-2 rounded-xl bg-white/5 p-2.5"><Gold>{i + 1}</Gold>{s}</p>
        ))}
      </div>
      <p className="mt-4 rounded-full bg-[#facc15] py-2.5 text-center text-sm font-bold text-black">Dinner saved · +15 XP</p>
    </div>
  );
}

export function PantryScreen() {
  const items = ["½ onion", "2 eggs", "spinach", "cooked rice", "soy sauce", "garlic"];
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-widest text-white/50">Pantry-to-Plate</p>
      <p className="mt-1 text-2xl font-bold">In your fridge <Gold>right now</Gold></p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((i) => <span key={i} className="rounded-full border border-white/15 px-3 py-1 text-xs">{i}</span>)}
      </div>
      <p className="mt-6 text-sm text-white/60">3 dinners, no shopping trip</p>
      <div className="mt-2 space-y-2">
        {[["Egg fried rice", "15 min · uses 6 of 6"], ["Spinach omelette", "10 min · uses 4 of 6"], ["Garlic soy greens", "8 min · uses 3 of 6"]].map(([t, d]) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/5 p-2.5">
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#facc15] to-[#a6761d]" />
            <span><span className="block text-sm font-semibold">{t}</span><span className="text-[11px] text-white/50">{d}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillScreen() {
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-widest text-white/50">Step 2 of 6 · medium heat</p>
      <div className="mt-3 flex rounded-full bg-white/10 p-1 text-[11px] font-semibold">
        {["Beginner", "Intermediate", "Chef"].map((l, i) => (
          <span key={l} className={`flex-1 rounded-full py-1.5 text-center ${i === 0 ? "bg-[#facc15] text-black" : "text-white/60"}`}>{l}</span>
        ))}
      </div>
      <ul className="mt-5 space-y-3 text-lg font-medium leading-snug">
        <li>Add the butter. Wait until it foams and smells nutty, about 2 min.</li>
        <li>Lay the steak away from you so the oil doesn&apos;t splash.</li>
      </ul>
      <p className="mt-4 text-sm text-white/50">&ldquo;Sear&rdquo; = cook hot and fast until a brown crust forms.</p>
      <p className="mt-6 rounded-2xl border-2 border-[#facc15] py-3 text-center font-bold">Start 3 min timer</p>
    </div>
  );
}
