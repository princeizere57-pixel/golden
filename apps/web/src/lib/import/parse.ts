// Reads the schema.org `Recipe` JSON-LD that most recipe sites publish for search engines.
// Pure: takes HTML, returns the fields we need, or null if the page has no structured recipe.

export interface ImportedRecipe {
  title: string;
  summary: string;
  author?: string;
  image?: string;
  sourceUrl: string;
  sourceName: string;
  serves: number;
  ingredients: string[];
  steps: string[];
}

type Node = Record<string, unknown>;

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—", frac12: "½", frac14: "¼", frac34: "¾", deg: "°" };

/** Strips tags, decodes common entities and collapses whitespace. */
export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+\d*);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m),
    )
    .replace(/\s+/g, " ")
    .trim();
}

const isRecipe = (n: Node) => [n["@type"]].flat().some((t) => t === "Recipe");

function findRecipe(value: unknown): Node | null {
  if (Array.isArray(value)) {
    for (const v of value) {
      const found = findRecipe(v);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const node = value as Node;
  if (isRecipe(node)) return node;
  return findRecipe(node["@graph"]) ?? findRecipe(node.mainEntity);
}

/** Flattens recipeInstructions: strings, HowToStep, HowToSection, or nested lists. */
function steps(value: unknown): string[] {
  if (typeof value === "string") {
    // Some sites put every step in one string separated by newlines or <li>s.
    return value.split(/\n+|<\/li>/i).map(cleanText).filter(Boolean);
  }
  if (Array.isArray(value)) return value.flatMap(steps);
  if (value && typeof value === "object") {
    const n = value as Node;
    if (n.itemListElement) return steps(n.itemListElement);
    return [cleanText(n.text ?? n.name)].filter(Boolean);
  }
  return [];
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (value && typeof value === "object") return firstString((value as Node).url ?? (value as Node).name);
  return undefined;
}

/** A person's or organisation's name; never a URL (some sites give the author as a link). */
function authorName(value: unknown): string | undefined {
  const node = Array.isArray(value) ? value[0] : value;
  const name = cleanText(node && typeof node === "object" ? (node as Node).name : node);
  return name && !/^https?:\/\//i.test(name) ? name : undefined;
}

function serves(value: unknown): number {
  const n = Number(String(firstString(value) ?? [value].flat()[0] ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 && n < 100 ? n : 2;
}

export function extractRecipe(html: string, url: string): ImportedRecipe | null {
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  let recipe: Node | null = null;
  for (const [, json] of blocks) {
    try {
      recipe = findRecipe(JSON.parse(json.trim()));
    } catch {
      continue;
    }
    if (recipe) break;
  }
  if (!recipe) return null;

  const ingredients = [recipe.recipeIngredient ?? recipe.ingredients].flat().map(cleanText).filter(Boolean);
  const method = steps(recipe.recipeInstructions);
  const title = cleanText(recipe.name);
  if (!title || !ingredients.length || !method.length) return null;

  const siteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return {
    title,
    summary: cleanText(recipe.description).slice(0, 280),
    author: authorName(recipe.author),
    image: firstString(recipe.image),
    sourceUrl: url,
    sourceName: cleanText(siteName) || new URL(url).hostname.replace(/^www\./, ""),
    serves: serves(recipe.recipeYield),
    ingredients,
    steps: method,
  };
}
