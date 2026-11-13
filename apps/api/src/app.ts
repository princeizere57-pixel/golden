import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth.js";
import { env } from "./env.js";
import { health } from "./routes/health.js";
import { profile } from "./routes/profile.js";

// Convention for apps/api: HTTP wiring here (middleware + mounting), request handling in
// src/routes/*, business logic in src/services/* (added as endpoints land), data in src/db/*.
const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: env.WEB_ORIGIN, credentials: true }));

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Better Auth owns everything under its basePath; the web proxies /api/auth/* here unstripped.
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/", health);
app.route("/", profile);

export default app;
