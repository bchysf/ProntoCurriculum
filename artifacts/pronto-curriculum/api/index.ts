import type { IncomingMessage, ServerResponse } from "node:http";

// Vercel Serverless Function entry point for the whole Express API.
// Every /api/* request is rewritten to /api by vercel.json, which resolves
// to this file; Vercel keeps the original path in req.url, so the Express
// routes mounted under "/api" match unchanged.
//
// The app is imported dynamically inside the handler: a static import that
// throws (e.g. a module-scope "env var must be set" check) would crash the
// function before any code runs, yielding an opaque FUNCTION_INVOCATION_FAILED
// with no way to see the error without dashboard access. This way boot
// failures surface in the HTTP response instead.
const appPromise = import("@workspace/api-server/app").then((m) => m.default);

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const app = await appPromise;
    app(req, res);
  } catch (err) {
    const e = err as Error;
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: "api_boot_failure",
        message: e?.message ?? String(err),
        stack: e?.stack?.split("\n").slice(0, 6),
      }),
    );
  }
}
