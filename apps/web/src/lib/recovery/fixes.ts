// Module C: "Fix My Mistake". A deterministic catalogue of common cooking failures with exact
// pantry maths, scaled to the batch in front of the cook. The AI layer can add context on top,
// but these fixes always work offline.

export type MistakeId =
  | "too-salty"
  | "broken-emulsion"
  | "burnt-garlic"
  | "too-spicy"
  | "sauce-too-thin"
  | "sauce-too-thick"
  | "overcooked-pasta"
  | "overcooked-meat"
  | "burnt-bottom"
  | "too-bland";

export interface Mistake {
  id: MistakeId;
  label: string;
}

export const MISTAKES: Mistake[] = [
  { id: "too-salty", label: "Too salty" },
  { id: "broken-emulsion", label: "Sauce split / broke" },
  { id: "burnt-garlic", label: "Burnt the garlic" },
  { id: "too-spicy", label: "Too spicy" },
  { id: "sauce-too-thin", label: "Sauce too thin" },
  { id: "sauce-too-thick", label: "Sauce too thick" },
  { id: "overcooked-pasta", label: "Pasta overcooked" },
  { id: "overcooked-meat", label: "Meat dry or overcooked" },
  { id: "burnt-bottom", label: "Burnt on the bottom" },
  { id: "too-bland", label: "Tastes bland" },
];

export interface FixInput {
  /** Volume of the dish or sauce in ml. */
  volumeMl: number;
  /** How far off it is, 1 (a little) to 3 (a lot). */
  severity?: 1 | 2 | 3;
}

export interface Fix {
  mistake: MistakeId;
  headline: string;
  steps: string[];
  /** Exact quantities for this batch. */
  amounts: Array<{ what: string; amount: string }>;
}

const ml = (n: number) => `${Math.round(n)} ml`;
const tbsp = (n: number) => `${Math.round(n * 2) / 2} tbsp`;

/** Returns the recovery steps for a mistake, scaled to the batch. */
export function fixMistake(mistake: MistakeId, input: FixInput): Fix {
  const volume = Math.max(50, input.volumeMl);
  const severity = input.severity ?? 2;
  switch (mistake) {
    case "too-salty": {
      // Saltiness scales with concentration: to cut it by a fraction f, add volume × f / (1 − f)
      // of unsalted liquid. Severity maps to cutting saltiness by 15%, 25% or 35%.
      const f = [0.15, 0.25, 0.35][severity - 1];
      const add = (volume * f) / (1 - f);
      return {
        mistake,
        headline: `Dilute: add ${ml(add)} of unsalted liquid`,
        steps: [
          "Add unsalted stock, water, or tinned tomatoes (whatever suits the dish).",
          "Bring back to temperature and taste again before adding anything else.",
          "If it's still too salty, a squeeze of acid (lemon or vinegar) masks salt without adding volume.",
        ],
        amounts: [{ what: "Unsalted liquid", amount: ml(add) }],
      };
    }
    case "broken-emulsion": {
      // Restart with a fresh base: 1 tbsp warm water (or 1 yolk) per ~250 ml of broken sauce,
      // then whisk the broken sauce back in a spoonful at a time.
      const base = volume / 250;
      return {
        mistake,
        headline: "Re-emulsify from a fresh base",
        steps: [
          "Take the pan off the heat so it stops separating further.",
          "In a clean bowl, whisk the fresh base (warm water, or an egg yolk for butter/egg sauces).",
          "Add the broken sauce one spoonful at a time, whisking until each is absorbed.",
        ],
        amounts: [
          { what: "Warm water (or egg yolks)", amount: `${tbsp(base)} (or ${Math.max(1, Math.round(base))} yolk)` },
        ],
      };
    }
    case "burnt-garlic":
      return {
        mistake,
        headline: "Start the garlic again; it can't be saved",
        steps: [
          "Tip out the garlic and oil: burnt garlic turns the whole dish bitter.",
          "Wipe the pan, add fresh oil over medium-low heat.",
          "Add fresh garlic and pull it as soon as it's pale gold (30–60 s).",
        ],
        amounts: [{ what: "Fresh oil", amount: tbsp(Math.max(1, volume / 250)) }],
      };
    case "too-spicy": {
      // Capsaicin is fat-soluble: dairy or fat binds it. ~2 tbsp per 250 ml per severity step.
      const dairy = (volume / 250) * 2 * severity;
      return {
        mistake,
        headline: `Cool it down with ${tbsp(dairy)} of dairy or fat`,
        steps: [
          "Stir in yoghurt, cream, coconut milk, or nut butter (capsaicin dissolves in fat).",
          "Balance with a little sugar or honey and a squeeze of acid.",
          "Serve with something starchy (rice, bread) to spread the heat.",
        ],
        amounts: [
          { what: "Yoghurt / cream / coconut milk", amount: tbsp(dairy) },
          { what: "Sugar or honey", amount: `${Math.round((volume / 500) * severity * 10) / 10} tsp` },
        ],
      };
    }
    case "sauce-too-thin": {
      // Cornflour slurry: about 1 tbsp cornflour per 250 ml thickens a sauce noticeably.
      const corn = (volume / 250) * (severity / 2);
      return {
        mistake,
        headline: `Thicken with a slurry of ${tbsp(corn)} cornflour`,
        steps: [
          "Mix the cornflour with an equal amount of cold water until smooth.",
          "Stir it into the simmering sauce and cook for 1–2 minutes until glossy.",
          "Or reduce instead: simmer uncovered; it loses roughly 10% of its volume every 3–4 minutes.",
        ],
        amounts: [
          { what: "Cornflour", amount: tbsp(corn) },
          { what: "Cold water", amount: tbsp(corn) },
        ],
      };
    }
    case "sauce-too-thick": {
      const add = volume * 0.1 * severity;
      return {
        mistake,
        headline: `Loosen with ${ml(add)} of hot liquid`,
        steps: [
          "Add hot stock, pasta water, or milk a splash at a time.",
          "Stir and wait 30 seconds between additions; it thins as it heats.",
        ],
        amounts: [{ what: "Hot liquid", amount: ml(add) }],
      };
    }
    case "overcooked-pasta":
      return {
        mistake,
        headline: "Rescue the texture in a hot pan",
        steps: [
          "Drain immediately and spread out so it stops cooking.",
          "Fry in a hot pan with a little oil until the edges crisp.",
          "Toss with the sauce at the last moment so it doesn't soften further.",
        ],
        amounts: [{ what: "Oil", amount: tbsp(Math.max(1, volume / 400)) }],
      };
    case "overcooked-meat": {
      // Rehydrate in a little seasoned liquid: about 60 ml per 250 g of meat (volume ≈ weight here).
      const liquid = (volume / 250) * 60;
      return {
        mistake,
        headline: "Slice it thin and rest it in warm sauce",
        steps: [
          "Slice the meat thinly across the grain: shorter fibres feel more tender.",
          "Warm stock or the pan juices with a knob of butter; don't let it boil.",
          "Let the slices sit in the warm liquid for 2–3 minutes, then serve with the sauce spooned over.",
        ],
        amounts: [{ what: "Warm stock or pan juices", amount: ml(liquid) }, { what: "Butter", amount: tbsp(Math.max(1, volume / 500)) }],
      };
    }
    case "burnt-bottom":
      return {
        mistake,
        headline: "Don't stir: move the good part to a clean pan",
        steps: [
          "Take the pan off the heat straight away and don't scrape the bottom.",
          "Gently spoon the unburnt top into a clean pan, leaving the scorched layer behind.",
          "Taste it: if it's smoky, add a splash of milk or cream and a pinch of sugar to soften the bitterness.",
        ],
        amounts: [{ what: "Milk or cream (if it tastes smoky)", amount: tbsp(Math.max(1, (volume / 250) * severity)) }],
      };
    case "too-bland": {
      // Season in rounds: about ⅛ tsp salt per 250 ml, plus a little acid to wake it up.
      const salt = Math.round((volume / 250) * 0.125 * severity * 100) / 100;
      return {
        mistake,
        headline: "Season in small rounds: salt, then acid",
        steps: [
          "Add the salt, stir, and taste after 30 seconds.",
          "Add a squeeze of lemon or a dash of vinegar to brighten it.",
          "Still flat? Add something savoury: a little soy sauce, parmesan or stock powder.",
        ],
        amounts: [
          { what: "Salt", amount: `${salt} tsp` },
          { what: "Lemon juice or vinegar", amount: `${Math.round((volume / 500) * severity * 10) / 10} tsp` },
        ],
      };
    }
  }
}
