import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Culinary Arts Modules" };

const MODULES = [
  {
    id: "chinese",
    cuisine: "Chinese",
    focus: "Wok mastery and heat control",
    lessons: [
      ["Mise en place first", "Stir-frying takes minutes, so everything is cut, measured and lined up by the stove before the heat goes on."],
      ["Heat the wok, then the oil", "Heat the empty pan until a drop of water skitters and vanishes, then add oil. Food sticks less and sears instead of stewing."],
      ["Small batches", "Crowding drops the temperature and steams the food. Cook protein in batches, set aside, and add back at the end."],
      ["Velveting", "Toss sliced meat with a little cornstarch, soy and oil for 15 minutes. It stays tender over high heat."],
      ["Sauce at the end", "Add a mixed sauce (with a pinch of cornstarch) in the last minute; it thickens and glosses everything at once."],
    ],
  },
  {
    id: "korean",
    cuisine: "Korean",
    focus: "Fermentation and dynamic balance",
    lessons: [
      ["The flavor triangle", "Gochujang (sweet heat), doenjang (deep savory) and soy sauce (salt) are the base. Most sauces mix two of them."],
      ["Balance on purpose", "Taste for spicy, salty, sweet, sour and nutty. Sesame oil and toasted seeds round the edges; rice vinegar lifts."],
      ["Fermented flavor fast", "Older, sour kimchi is perfect for cooking: fry it with rice, stew it, or add it to pancakes."],
      ["Banchan thinking", "Several small sides from one vegetable each: blanch, season with sesame oil, garlic and salt. Great for leftovers."],
      ["Rice is the canvas", "Rinse until the water runs nearly clear and rest it 10 minutes after cooking for separate, glossy grains."],
    ],
  },
  {
    id: "italian",
    cuisine: "Italian",
    focus: "Pan-sauce emulsification and pasta texture",
    lessons: [
      ["Salt the water well", "About 10 g of salt per litre. It's the only chance to season the pasta itself."],
      ["Save the pasta water", "The starch in it binds fat and liquid into a glossy sauce. Keep a cup before draining."],
      ["Finish in the pan", "Take pasta out a minute early and finish it in the sauce with a splash of pasta water, tossing hard."],
      ["Emulsify off the heat", "Butter and cheese go in off the heat; too hot and the cheese clumps or the sauce splits."],
      ["Fewer, better ingredients", "Most classic sauces use four or five ingredients. Let one lead and season to taste at the end."],
    ],
  },
];

export default function ModulesPage() {
  return (
    <main className="mx-auto px-4 pb-12 pt-6">
      <h1 className="font-display text-[2.2rem]">Culinary <span className="text-accent">Arts</span> Modules</h1>
      <p className="mt-2 text-muted">Technique, not memorizing. Learn why things work and you&apos;ll cook freely without checking a recipe.</p>
      <nav aria-label="Cuisines" className="mt-4 flex gap-2">
        {MODULES.map((m) => <a key={m.id} href={`#${m.id}`} className="rounded-full border-2 border-line px-4 py-2 font-semibold">{m.cuisine}</a>)}
      </nav>
      {MODULES.map((m) => (
        <section key={m.id} id={m.id} className="mt-8 scroll-mt-20" aria-labelledby={`${m.id}-title`}>
          <h2 id={`${m.id}-title`} className="font-display text-[1.6rem]">{m.cuisine}</h2>
          <p className="text-muted">{m.focus}</p>
          <ol className="mt-3 space-y-3">
            {m.lessons.map(([t, d], i) => (
              <li key={t} className="rounded-2xl bg-surface p-4">
                <p className="font-semibold">{i + 1}. {t}</p>
                <p className="mt-1 text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <Link href={`/explore?q=${m.cuisine}`} className="mt-3 inline-block underline">Practise with {m.cuisine} recipes</Link>
        </section>
      ))}
    </main>
  );
}
