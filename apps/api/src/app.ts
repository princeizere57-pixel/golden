import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { env } from "./env";
import { health } from "./routes/health";

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

app.route("/", health);

export default app;
