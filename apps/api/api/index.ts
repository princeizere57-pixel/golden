import { handle } from "@hono/node-server/vercel";
import app from "../src/app";

// Vercel Node function entry. vercel.json rewrites every path here; Hono does the routing.
// Vanilla Vercel functions don't pre-parse the body, so Hono gets the raw stream (webhooks).
export default handle(app);
