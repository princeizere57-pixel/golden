// Discover building blocks: rails of photo cards, collection cards, the dish of the day,
// and quick tiles. Server components; interactive bits live in recipe-actions.tsx.

import Link from "next/link";
import { ShareButton } from "@/components/recipe-actions";
import { TimeTile } from "@/components/time-tile";
import { formatDuration, recipeHref, totalMinutes } from "@/lib/links";
import { thumb } from "@/lib/mealdb/convert";
import { difficulty } from "@/lib/skill/difficulty";
import type { Recipe } from "@/lib/types";

const img = (r: Recipe) => (r.image ? thumb(r.image) : undefined);
const LEVEL_BADGE = { Easy: "bg-basil", Medium: "bg-saffron", Advanced: "bg-aubergine" };

export function Rail({ heading, line, children, href }: { heading: string; line?: string; children: React.ReactNode; href?: string }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4 px-4">
        <div>
          <h2 className="text-[1.45rem] font-semibold tracking-tight">{heading}</h2>
          {line && <p className="mt-0.5 text-sm text-muted">{line}</p>}
        </div>
        {href && <Link href={href} className="shrink-0 text-sm font-medium underline">See all</Link>}
      </div>
      <div className="rail flex gap-4 overflow-x-auto px-4 pb-1">{children}</div>
    </section>
  );
}

/** Photo on top, title and time underneath. */
export function PhotoCard({ recipe, badge, wide = false }: { recipe: Recipe; badge?: string; wide?: boolean }) {
  const d = difficulty(recipe);
  return (
    <Link href={recipeHref(recipe)} className={`group block shrink-0 ${wide ? "w-80" : "w-64"}`}>
      <span className="relative block overflow-hidden rounded-3xl bg-surface">
        {img(recipe) ? (
          // eslint-disable-next-line @next/next/no-img-element -- TheMealDB CDN photo, 350 px
          <img src={img(recipe)} alt="" width={350} height={350} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <TimeTile time={formatDuration(totalMinutes(recipe))} />
        )}
        {badge && <span className="absolute left-3 top-3 rounded-full bg-bg px-3 py-1 text-xs font-bold tracking-wide">{badge}</span>}
        <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${LEVEL_BADGE[d.label]}`}>{d.label}</span>
      </span>
      <span className="mt-2.5 block text-[17px] leading-snug">{recipe.title}</span>
      <span className="text-sm text-muted">{formatDuration(totalMinutes(recipe))}</span>
    </Link>
  );
}

/** Big dark card for a themed collection: cover photo, title, line, thumbnails, button. */
export function CollectionCard({ title, line, href, recipes }: { title: string; line: string; href: string; recipes: Recipe[] }) {
  const [cover, ...rest] = recipes;
  return (
    <Link href={href} className="group relative block w-[19rem] shrink-0 overflow-hidden rounded-3xl bg-charcoal text-white">
      {cover && img(cover) && (
        // eslint-disable-next-line @next/next/no-img-element -- TheMealDB CDN photo
        <img src={img(cover)} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-5">
        <span className="block text-2xl font-bold leading-tight">{title}</span>
        <span className="mt-1 block text-sm text-white/80">{line}</span>
        <span className="mt-4 flex items-center gap-3">
          <span className="flex -space-x-3">
            {rest.slice(0, 3).map((r) =>
              img(r) ? (
                // eslint-disable-next-line @next/next/no-img-element -- TheMealDB CDN photo
                <img key={r.slug} src={img(r)} alt="" className="h-11 w-11 rounded-xl border-2 border-white object-cover" />
              ) : null,
            )}
          </span>
          <span className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white/20 font-medium backdrop-blur">View recipes</span>
        </span>
      </span>
    </Link>
  );
}

export function DishOfTheDay({ recipe }: { recipe: Recipe }) {
  const href = recipeHref(recipe);
  return (
    <section className="mt-10 px-4">
      <div className="relative overflow-hidden rounded-3xl bg-charcoal text-white">
        <Link href={href} className="block">
          {img(recipe) && (
            // eslint-disable-next-line @next/next/no-img-element -- TheMealDB CDN photo
            <img src={recipe.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-5">
            <span className="block text-sm text-white/85">Your dish of the day · {difficulty(recipe).label}</span>
            <span className="mt-1 block font-display text-3xl">{recipe.title}</span>
          </span>
        </Link>
        <ShareButton title={recipe.title} path={href} className="absolute right-4 top-4" />
      </div>
    </section>
  );
}

export function QuickTile({ href, label, image }: { href: string; label: string; image?: string }) {
  return (
    <Link href={href} className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-surface p-2 pr-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- TheMealDB CDN photo
        <img src={image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="h-14 w-14 shrink-0 rounded-xl bg-accent-soft" />
      )}
      <span className="text-[15px] leading-tight">{label}</span>
    </Link>
  );
}

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/explore" role="search" className="relative">
      <label htmlFor="discover-search" className="sr-only">Search recipes</label>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink" aria-hidden>
        <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.2-4.2" />
      </svg>
      <input id="discover-search" name="q" defaultValue={defaultValue} placeholder="Search ingredients, recipes, techniques…" className="min-h-14 w-full rounded-full border border-line bg-bg pl-12 pr-5 text-base shadow-sm placeholder:text-muted/70" />
    </form>
  );
}
