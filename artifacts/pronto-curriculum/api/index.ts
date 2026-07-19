import type { IncomingMessage, ServerResponse } from "node:http";

// Vercel Serverless Function entry point for the whole Express API.
// Every /api/* request is rewritten to /api by vercel.json, which resolves
// to this file; Vercel keeps the original path in req.url, so the Express
// routes mounted under "/api" match unchanged.
//
// The app is imported dynamically with the rejection handler attached
// immediately: a static import that throws would kill the function with an
// opaque FUNCTION_INVOCATION_FAILED, and a bare import() promise that
// rejects before the first request becomes an unhandled rejection that
// crashes the process during init (which surfaces as requests hanging
// forever). Capturing the error lets us return it in the HTTP response.
type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

const loaded: Promise<{ app?: NodeHandler; err?: unknown }> = import(
  "@workspace/api-server/app"
)
  .then((m) => {
    // Guard against ESM/CJS interop double-wrapping the default export.
    const mod = m as { default?: unknown };
    const candidate =
      typeof mod.default === "function"
        ? mod.default
        : typeof (mod.default as { default?: unknown } | undefined)?.default ===
            "function"
          ? (mod.default as { default: unknown }).default
          : null;
    if (!candidate) {
      return {
        err: new Error(
          `app module loaded but default export is not a function (got ${typeof mod.default})`,
        ),
      };
    }
    return { app: candidate as NodeHandler };
  })
  .catch((err: unknown) => ({ err }));

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const { app, err } = await loaded;
  if (app) {
    app(req, res);
    return;
  }
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
