"use client";

import { useState } from "react";

/** Recipe video: a light thumbnail first, and YouTube (privacy-enhanced) only loads when tapped. */
export function VideoSnippet({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-charcoal">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={`How to make ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Play the video for ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-button text-button-ink shadow-xl transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Watch how it&apos;s done</span>
        </button>
      )}
    </div>
  );
}
