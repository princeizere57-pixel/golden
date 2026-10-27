"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/types";

/**
 * Shows an imported recipe's photo straight from the source's server, with a credit link.
 * A plain <img> on purpose: next/image would proxy and cache it, which is re-hosting.
 */
export function SourcePhoto({ recipe, className = "", credit = true }: { recipe: Recipe; className?: string; credit?: boolean }) {
  const [failed, setFailed] = useState(false);
  const owner = recipe.imageCredit ?? recipe.source;
  if (!recipe.image || !owner || failed) return null;
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- must load from the source, not our image proxy */}
      <img
        src={recipe.image}
        alt={recipe.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full rounded-3xl object-cover"
      />
      {credit && (
        <figcaption className="mt-1.5 text-xs text-muted">
          Photo: <a href={owner.url} target="_blank" rel="noopener noreferrer" className="underline">{owner.name} ↗</a>
          {recipe.imageCredit && " (similar dish)"}
        </figcaption>
      )}
    </figure>
  );
}
