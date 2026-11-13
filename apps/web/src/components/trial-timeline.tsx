// "How your free days work": exactly what happens and when, so nobody has to wonder about
// being charged. Dates are real (from today), the price is the plan's.

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function trialEnd(days: number, from = new Date()) {
  const end = new Date(from);
  end.setDate(end.getDate() + days);
  return end;
}

export function TrialTimeline({ days, price, tone = "light", from = new Date() }: { days: number; price: string; tone?: "light" | "dark"; from?: Date }) {
  const end = trialEnd(days, from);
  const muted = tone === "dark" ? "text-white/60" : "text-muted";
  const rail = tone === "dark" ? "bg-white/15" : "bg-line";
  const steps = [
    { when: "Today", what: "Everything unlocked. $0 due.", detail: "Cook what you already have (Pantry-to-Plate)." },
    { when: `Day ${Math.max(2, days - 1)}`, what: "Keep cooking, keep saving.", detail: "Two dishes hot together (Timing Orchestrator). Save a dish (Fix My Mistake)." },
    { when: fmt(end), what: `First charge: ${price}`, detail: `Cancel any time before ${fmt(end)} in two taps and you pay nothing.` },
  ];
  return (
    <ol className="relative space-y-5" aria-label="How your free days work">
      <span aria-hidden className={`absolute bottom-3 left-[11px] top-3 w-0.5 ${rail}`} />
      {steps.map((s, i) => (
        <li key={s.when} className="relative flex gap-4">
          <span aria-hidden className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-[#facc15] text-black" : tone === "dark" ? "bg-white/15 text-white" : "bg-surface text-ink ring-1 ring-line"}`}>{i + 1}</span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide">{s.when}</span>
            <span className="block font-semibold">{s.what}</span>
            <span className={`block text-sm ${muted}`}>{s.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
