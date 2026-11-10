// The promise as a ticker: "Cook with Confidence · Waste Nothing · Level Up" gliding along a
// line. The real heading is for screen readers; the moving copy is decorative. With reduced
// motion it stands still (globals.css, .ticker-track).

const PHRASES = ["Cook with Confidence", "Waste Nothing", "Level Up"];

export function HeadlineTicker({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const line = tone === "dark" ? "border-white/15" : "border-line";
  const sep = tone === "dark" ? "text-[#facc15]" : "text-accent";
  const run = (key: string) => (
    <span key={key} className="flex shrink-0 items-center" aria-hidden>
      {PHRASES.map((p, i) => (
        <span key={p} className="flex items-center">
          <span className={i === 1 ? (tone === "dark" ? "text-gold" : "text-accent") : ""}>{p}</span>
          <span className={`mx-6 ${sep}`}>✦</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className={`relative overflow-hidden border-y py-4 ${line} ${className}`}>
      <h1 className="sr-only">Cook with Confidence, Waste Nothing and Level Up</h1>
      <div className="ticker-track flex w-max whitespace-nowrap font-display text-[2.2rem] leading-none">
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}
