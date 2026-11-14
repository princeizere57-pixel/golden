import { Hono } from "hono";
import { getRecipeBySlug, listRecipes } from "../services/catalogue.js";

export const recipes = new Hono();

// Golden's own recipes (public). The web caches this for 5 minutes and falls back to its bundled copy.
recipes.get("/recipes", async (c) => c.json({ recipes: await listRecipes() }));

recipes.get("/recipes/:slug", async (c) => {
  const recipe = await getRecipeBySlug(c.req.param("slug"));
  return recipe ? c.json(recipe) : c.json({ error: "Not Found" }, 404);
});
