import { handle } from "hono/vercel";
import app from "../src/app";

// Vercel function entry (web handler). vercel.json rewrites every path here; Hono routes it.
// Hono reads the raw request body, so webhook signature checks work.
export default handle(app);
