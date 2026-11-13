// Empty screens that teach the next step instead of just saying "nothing here".

import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <span aria-hidden>{icon}</span>
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-xs text-muted">{text}</p>
      {action && (
        <Link href={action.href} className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-button px-6 font-semibold text-button-ink">{action.label}</Link>
      )}
    </div>
  );
}
