// Filled, 3D-style icons drawn for Golden: soft gradients, a highlight and a contact
// shadow give each one depth. Pure SVG, no assets. Ids are prefixed to stay unique per icon.

type Props = { size?: number; className?: string };

function Shadow({ cx = 16, cy = 29, rx = 10 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry="1.6" fill="#000" opacity="0.12" />;
}

/** Discover: a magnifying lens. */
export function LensIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="lens-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fb4ff" /><stop offset="1" stopColor="#3b5bdb" /></linearGradient>
        <radialGradient id="lens-glass" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor="#d6f1ff" /><stop offset="1" stopColor="#8fd3fe" /></radialGradient>
        <linearGradient id="lens-handle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5c4033" /><stop offset="1" stopColor="#2b1d16" /></linearGradient>
      </defs>
      <Shadow cx={17} />
      <rect x="18.5" y="17" width="5.2" height="12" rx="2.6" transform="rotate(-45 21 23)" fill="url(#lens-handle)" />
      <circle cx="13" cy="13" r="10" fill="url(#lens-rim)" />
      <circle cx="13" cy="13" r="7.2" fill="url(#lens-glass)" />
      <path d="M8.6 10.6a5.4 5.4 0 0 1 4.2-3.3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** For you: a modern bowl with steam rising. */
export function SteamingDishIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="dish-bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9f5a" /><stop offset="1" stopColor="#e8590c" /></linearGradient>
        <linearGradient id="dish-food" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffe066" /><stop offset="1" stopColor="#fab005" /></linearGradient>
      </defs>
      <Shadow />
      <g fill="none" stroke="#adb5bd" strokeWidth="1.6" strokeLinecap="round">
        <path d="M11 9c-1.5-1.6 1.5-2.6 0-4.4" className="steam" />
        <path d="M16 8.5c-1.5-1.8 1.5-3 0-5" className="steam" />
        <path d="M21 9c-1.5-1.6 1.5-2.6 0-4.4" className="steam" />
      </g>
      <ellipse cx="16" cy="15" rx="12" ry="3.2" fill="url(#dish-food)" />
      <circle cx="12" cy="14.6" r="1.4" fill="#40c057" />
      <circle cx="18.5" cy="14.2" r="1.2" fill="#fa5252" />
      <path d="M4 15.2h24a12 11 0 0 1-24 0z" fill="url(#dish-bowl)" />
      <path d="M7 18.5c2 3.6 5.2 5.4 9 5.6" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="11" y="25.4" width="10" height="2" rx="1" fill="#c2410c" />
    </svg>
  );
}

/** Shopping list: a yellow notepad with a black pen. */
export function NotepadIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="pad-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3a3" /><stop offset="1" stopColor="#fcc419" /></linearGradient>
        <linearGradient id="pad-pen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#495057" /><stop offset="0.5" stopColor="#212529" /><stop offset="1" stopColor="#000" /></linearGradient>
      </defs>
      <Shadow />
      <rect x="5" y="4.5" width="18" height="23" rx="3" fill="url(#pad-paper)" />
      <rect x="5" y="4.5" width="18" height="4.5" rx="2" fill="#f08c00" />
      {[8, 12, 16].map((x) => <circle key={x} cx={x + 0.5} cy="4.6" r="1.3" fill="#868e96" />)}
      <g stroke="#e8a100" strokeWidth="1.2" strokeLinecap="round">
        <path d="M8.5 13h11M8.5 17h11M8.5 21h7" />
      </g>
      <g transform="rotate(38 22 18)">
        <rect x="20.2" y="6" width="3.6" height="17" rx="1.4" fill="url(#pad-pen)" />
        <path d="M20.2 23h3.6L22 27z" fill="#f1f3f5" />
        <path d="M21.4 25.6h1.2L22 27z" fill="#000" />
        <rect x="20.2" y="9" width="3.6" height="1.2" fill="#adb5bd" />
      </g>
    </svg>
  );
}

/** Saved: a blue sack closed with a small plastic clip. */
export function SackIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id="sack-body" cx="0.35" cy="0.35" r="0.85"><stop offset="0" stopColor="#74c0fc" /><stop offset="0.6" stopColor="#228be6" /><stop offset="1" stopColor="#1864ab" /></radialGradient>
        <linearGradient id="sack-clip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ced4da" /></linearGradient>
      </defs>
      <Shadow />
      <path d="M11 6.5c1.2 1.4 2.6 2 5 2s3.8-.6 5-2l-1.2 4.2h-7.6z" fill="#339af0" />
      <path d="M12.2 10.4h7.6c5.4 3 8.2 7.4 7.2 12.4-.8 4.2-5 5.7-11 5.7s-10.2-1.5-11-5.7c-1-5 1.8-9.4 7.2-12.4z" fill="url(#sack-body)" />
      <path d="M8.4 19.5c.4-2.6 1.8-4.6 3.8-6" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <rect x="10.6" y="8.8" width="10.8" height="3.2" rx="1.6" fill="url(#sack-clip)" stroke="#adb5bd" strokeWidth="0.5" />
      <rect x="18.6" y="9.4" width="1.6" height="2" rx="0.5" fill="#fa5252" />
    </svg>
  );
}

/** Chef's hat, for skill-engine entries. */
export function HatIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id="hat-puff" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#dee2e6" /></radialGradient>
      </defs>
      <Shadow />
      <circle cx="10" cy="13" r="6" fill="url(#hat-puff)" />
      <circle cx="22" cy="13" r="6" fill="url(#hat-puff)" />
      <circle cx="16" cy="10" r="7" fill="url(#hat-puff)" />
      <rect x="8" y="15" width="16" height="9" rx="1.5" fill="url(#hat-puff)" />
      <rect x="8" y="22" width="16" height="4.5" rx="1.5" fill="#ced4da" />
    </svg>
  );
}

/** Lifebuoy, for Fix My Mistake entries. */
export function LifebuoyIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <Shadow />
      <circle cx="16" cy="15" r="11" fill="#fff" stroke="#dee2e6" />
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M16 4a11 11 0 0 1 7.8 3.2l-3.5 3.5A6 6 0 0 0 16 9z" fill="#fa5252" transform={`rotate(${a} 16 15)`} />
      ))}
      <circle cx="16" cy="15" r="5.4" fill="#f8f9fa" stroke="#ced4da" />
      <path d="M8.5 9.5a10 10 0 0 1 4-3.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Trophy, for rank-ups. */
export function TrophyIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe066" /><stop offset="1" stopColor="#e67700" /></linearGradient>
      </defs>
      <Shadow />
      <path d="M7 6h4v3.5a4 4 0 0 1-4-3.5zM25 6h-4v3.5a4 4 0 0 0 4-3.5z" fill="none" stroke="#f59f00" strokeWidth="2" />
      <path d="M10 4h12v6a6 6 0 0 1-12 0z" fill="url(#trophy-gold)" />
      <rect x="14.5" y="15.5" width="3" height="5" fill="#f59f00" />
      <rect x="10" y="20.5" width="12" height="5" rx="1.5" fill="#862e9c" />
      <path d="M12.5 6.5v3" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Flame, for streaks. */
export function FlameIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="flame-outer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffa94d" /><stop offset="1" stopColor="#e8590c" /></linearGradient>
      </defs>
      <Shadow rx={7} />
      <path d="M16 3c1 4.5 7.5 7 7.5 14a7.5 7.5 0 0 1-15 0c0-4 2.4-5.6 3.4-8.4.6 2.2 1.6 3.2 2.6 3.6C14 8.6 15 5.6 16 3z" fill="url(#flame-outer)" />
      <path d="M16 13.5c.6 2.4 3.6 3.6 3.6 7a3.6 3.6 0 0 1-7.2 0c0-2.2 1.4-3 2-4.6.6.8 1 1 1.6 1.2-.2-1.2 0-2.4 0-3.6z" fill="#ffe066" />
    </svg>
  );
}

/** Plan a meal: tall flames rising out of a wide dark pan, with a black handle. */
export function PanFireIcon({ size = 28, className }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="pf-outer" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#e03131" /><stop offset="0.55" stopColor="#f76707" /><stop offset="1" stopColor="#ff922b" /></linearGradient>
        <linearGradient id="pf-mid" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fd7e14" /><stop offset="1" stopColor="#fcc419" /></linearGradient>
        <linearGradient id="pf-pan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5c6670" /><stop offset="1" stopColor="#2b3138" /></linearGradient>
      </defs>
      <ellipse cx="15" cy="30.2" rx="12" ry="1.3" fill="#000" opacity="0.12" />
      <g className="flicker">
        {/* Outer red-orange flames: tall in the middle, licking out to both sides. */}
        <path d="M5 21C3.6 17.5 4.4 14.6 6.2 12.8c-.2 2 .4 3.4 1.4 4.2-.6-3.6.6-7 3-9.2-.4 2.6.2 4.6 1.4 5.8-.2-4.4 1.2-8.4 4.4-11.2-.6 3.6.2 6.4 1.8 8.2.4-2.6 1.6-4.6 3.4-5.8-.8 2.8-.4 5.4 1 7.2.6-1.6 1.6-2.8 2.8-3.4-.6 2-.4 3.8.6 5.4.4-.8 1-1.4 1.8-1.8-.4 2.6-.8 5.6-2.2 8.8z" fill="url(#pf-outer)" />
        {/* Inner orange-yellow flames. */}
        <path d="M8 21c-.6-2.6.2-4.6 1.6-5.8 0 1.4.4 2.4 1.2 3-.2-2.8.8-5.2 2.6-6.8-.2 2 .4 3.4 1.4 4.2.2-3 1.2-5.6 3-7.2-.4 2.6.2 4.6 1.4 5.8.4-1.6 1.2-2.8 2.4-3.4-.4 2-.2 3.6.8 5-.2 1.8-.6 3.6-1.4 5.2z" fill="url(#pf-mid)" />
        <path d="M11.6 21c-.2-1.6.4-2.8 1.4-3.6 0 .8.4 1.4.8 1.8.2-1.6.8-3 2-4 0 1.2.4 2.2 1.2 2.8.4-1 1-1.8 1.8-2.2-.2 1.4 0 2.6.6 3.6-.2.6-.4 1.2-.8 1.6z" fill="#fff3bf" opacity="0.9" />
      </g>
      {/* Pan: wide shallow body with a lighter rim. */}
      <path d="M2.5 20.5h22.5c-.6 4.4-4.4 7.5-11.25 7.5S3.1 24.9 2.5 20.5z" fill="url(#pf-pan)" />
      <ellipse cx="13.75" cy="20.6" rx="11.25" ry="1.7" fill="#6c757d" />
      <path d="M5 23.4c2 1.6 5 2.4 8 2.4" stroke="#fff" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Handle: light band, then a long black grip. */}
      <path d="M24.6 22.2l1.8-.6.6 1.6-1.8.6z" fill="#dee2e6" />
      <path d="M26.4 21.6l4.6-1.6c.6-.2 1 .2.8.8l-.2.6c-.1.4-.4.6-.8.7l-3.8 1.1z" fill="#212529" />
    </svg>
  );
}
