import type { Metadata } from "next";
import Link from "next/link";
import { PhotoCard, Rail } from "@/components/discover";
import { KitchenLog } from "@/components/kitchen-log";
import { forLevel, libraryRecipes } from "@/lib/library";
import { difficulty } from "@/lib/skill/difficulty";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "For you" };

const LEVEL = { beginner: "Beginner", intermediate: "Intermediate", chef: "Chef" };
const NEXT = { beginner: "intermediate", intermediate: "chef", chef: null } as const;

/** Techniques to practise, in order, with the kind of recipe that teaches each. */
const PATH = {
  beginner: [
    { technique: "Knife basics: dice an onion", why: "Even pieces cook evenly.", find: /onion/i },
    { technique: "Cook rice and pasta perfectly", why: "Ratios and timing you can trust.", find: /rice|pasta|spaghetti|penne/i },
    { technique: "Brown, don't stew", why: "A hot, uncrowded pan is where flavour starts.", find: /fry|brown|sear/i },
  ],
  intermediate: [
    { technique: "Make a pan sauce", why: "Deglaze, reduce and finish with butter.", find: /deglaz|reduc|sauce/i },
    { technique: "Sear for a crust", why: "Dry surface, hot pan, don't move it.", find: /sear|steak|salmon|chicken/i },
    { technique: "Cook two dishes at once", why: "Use the hands-off minutes for the next job.", find: /simmer|roast|bake/i },
  ],
  chef: [
    { technique: "Emulsions that never split", why: "Temperature and ratio control.", find: /emulsi|hollandaise|mayonnaise|butter sauce/i },
    { technique: "Braise for depth", why: "Collagen to gelatine: time and gentle heat.", find: /braise|stew|slow/i },
    { technique: "Pastry and precision baking", why: "Weights, temperatures and resting.", find: /pastry|tart|pie|dough/i },
  ],
};

export default async function ForYouPage() {
  const viewer = await getViewer();
  const library = libraryRecipes();
  const ranked = forLevel(library, viewer.skill);
  const next = NEXT[viewer.skill];

  return (
    <main className="mx-auto pb-10">
      <div className="px-4 pt-6">
        <h1 className="font-display text-[2.3rem]">For you</h1>
        <p className="mt-2 text-muted">
          Your skill path at <strong className="text-ink">{LEVEL[viewer.skill]}</strong> level.{" "}
          <Link href="/onboarding" className="underline">Retake the quiz</Link>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Link href="/pantry" className="col-span-2 rounded-2xl bg-accent-soft p-4 md:col-span-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Pantry-to-Plate</span>
            <span className="mt-1 block font-semibold leading-snug">Turn your leftovers into dinner</span>
          </Link>
          <Link href="/challenge" className="rounded-2xl bg-charcoal p-4 text-white">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[#facc15]">Start here</span>
            <span className="mt-1 block font-semibold leading-snug">3-Day Zero-Waste Challenge</span>
          </Link>
          <Link href="/modules" className="rounded-2xl border-2 border-button p-4">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Technique</span>
            <span className="mt-1 block font-semibold leading-snug">Chinese, Korean &amp; Italian modules</span>
          </Link>
        </div>
      </div>

      <div className="mt-6 px-4">
        <KitchenLog limit={4} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/you" className="underline">Full kitchen log and Mini You</Link>
          <Link href="/community" className="underline">Apprentice Meets Master community</Link>
        </div>
      </div>

      {PATH[viewer.skill].map((step, i) => {
        const recipes = ranked.filter((r) => step.find.test(`${r.title} ${r.blocks.map((b) => b.text).join(" ")}`)).slice(0, 8);
        return recipes.length ? (
          <Rail key={step.technique} heading={`${i + 1}. ${step.technique}`} line={`${step.why} Practise it with these.`}>
            {recipes.map((r) => <PhotoCard key={r.slug} recipe={r} />)}
          </Rail>
        ) : null;
      })}

      {next && (
        <Rail heading={`Next level: ${LEVEL[next]}`}>
          {library.filter((r) => difficulty(r).level === next).slice(0, 8).map((r) => <PhotoCard key={r.slug} recipe={r} />)}
        </Rail>
      )}
    </main>
  );
}
