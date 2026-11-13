import { handle } from "@hono/node-server/vercel";
import app from "../src/app.js";

// Vercel Node function entry. vercel.json rewrites every path here; Hono does the routing.
// This adapter gives a Node (req,res) handler and passes the raw body (webhook signatures).
export default handle(app);
