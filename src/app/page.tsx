import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { HOME_SEGMENTS, RECIPES } from "@/lib/data/recipes";
import { buildHome, categories } from "@/lib/discovery/segments";
import { activeMinutes } from "@/lib/skill/adapt";
import { getViewer } from "@/lib/viewer";

const SKILL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const viewer = await getViewer();
  const segments = buildHome(HOME_SEGMENTS, viewer, { recipes: RECIPES, category });
  const chips = categories(RECIPES);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24">
      <section className="py-10">
        <p className="text-sm font-medium text-muted">Cooking at {SKILL_LABEL[viewer.skill]} level · <Link className="underline" href="/onboarding">change</Link></p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">Recipes that meet you where you are.</h1>
      </section>

      <nav aria-label="Categories" className="rail -mx-4 flex gap-2 overflow-x-auto px-4 pb-4">
        <Chip href="/" active={!category}>All</Chip>
        {chips.map((c) => (
          <Chip key={c} href={`/?category=${encodeURIComponent(c)}`} active={category === c}>{c}</Chip>
        ))}
      </nav>

      {segments.map((segment) =>
        segment.type === "premiumPromo" ? (
          <section key={segment.id} className="my-8 rounded-3xl bg-charcoal p-8 text-white">
            <h2 className="text-2xl font-bold">{segment.heading}</h2>
            <p className="mt-2 max-w-xl text-white/80">Every recipe rewritten for your level, the hands-free cook mode and Fix My Mistake. 7 days free, then $45 a year.</p>
            <Link href="/premium" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-ink">Start free trial</Link>
          </section>
        ) : (
          <section key={segment.id} className="mt-8" aria-labelledby={`seg-${segment.id}`}>
            <h2 id={`seg-${segment.id}`} className="mb-3 text-xl font-bold">{segment.heading}</h2>
            <div className="rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
              {segment.recipes.map((r) => (
                <RecipeCard key={r.slug} recipe={r} activeMinutes={activeMinutes(r)} locked={r.premium && viewer.plan === "free"} />
              ))}
            </div>
          </section>
        ),
      )}
      {!segments.length && <p className="text-muted">Nothing here yet. Try another category.</p>}
    </main>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${active ? "border-ink bg-ink text-bg" : "border-line bg-surface"}`}
    >
      {children}
    </Link>
  );
}
