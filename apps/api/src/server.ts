import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app.js";

// Local dev only. On Vercel the app is served through api/index.ts.
const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
