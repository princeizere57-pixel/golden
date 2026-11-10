// Golden's claw mark as the loading signal: centred on the screen while a page or the internet
// reloads, with a band of sunlight sweeping diagonally down along the three strokes. The same mark
// is the favicon and the app icon (public/brand/claw.png), so the brand reads the same everywhere.
// Static (no sweep) under prefers-reduced-motion. Styles: .claw-* in globals.css.

/** The mark itself, any size: inline next to a "Loading…" line, or large on its own. */
export function ClawMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <span aria-hidden className={`claw-mark ${className}`} style={{ width: size, height: size }} />;
}

/** Full-screen loader: the claw in the centre of the browser or app, with an optional line under it. */
export function ClawLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="claw-loader" role="status" aria-live="polite">
      <ClawMark size={112} />
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Inline loading line: a small claw with text beside it. */
export function ClawInline({ text }: { text: string }) {
  return (
    <span role="status" className="inline-flex items-center justify-center gap-2 text-muted">
      <ClawMark size={28} />
      {text}
    </span>
  );
}
