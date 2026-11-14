// Golden's own recipes now live in @golden/shared (the API seeds its tables from them).
// Pages read the API's copy through lib/catalogue.ts; this is the bundled seed and offline fallback.
export { RECIPES, getRecipe, HOME_SEGMENTS } from "@/lib/types";
