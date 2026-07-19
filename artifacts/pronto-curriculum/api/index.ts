import app from "@workspace/api-server/app";

// Vercel Serverless Function entry point for the whole Express API.
// Every /api/* request is rewritten to /api by vercel.json, which resolves
// to this file; Vercel keeps the original path in req.url, so the Express
// routes mounted under "/api" match unchanged.
//
// The import must stay static: Vercel's bundler compiles the TypeScript
// workspace package into the function bundle only for static imports. A
// dynamic import() is left for runtime, where Node follows the workspace
// symlink to src/app.ts and fails with ERR_MODULE_NOT_FOUND. Because of
// that, no module in the app's import graph may throw at module scope —
// env-dependent clients (Stripe, Supabase, db) are created lazily so a
// missing env var only breaks the routes that need it.
export default app;
