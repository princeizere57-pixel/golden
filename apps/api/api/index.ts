// TEMP diagnostic: lazy-import everything inside a try/catch and return the real error as text,
// so an opaque FUNCTION_INVOCATION_FAILED becomes a readable stack over HTTP. Revert after.
export default async function handler(req: any, res: any) {
  try {
    const { handle } = await import("@hono/node-server/vercel");
    const app = (await import("../src/app")).default;
    return (handle(app) as any)(req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("INIT ERROR:\n" + (err?.stack || err?.message || String(err)));
  }
}
