// TheMealDB's terms ask apps to name them as the source of recipes and photos and link back.
// Shown at the foot of every page that lists library recipes.
/** `flush`: the page already has side padding. */
export function MealDbCredit({ flush = false }: { flush?: boolean }) {
  return (
    <p className={`mt-12 text-xs text-muted ${flush ? "" : "px-4"}`}>
      Library recipes and photos from{" "}
      <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer" className="underline">TheMealDB</a>.
    </p>
  );
}
