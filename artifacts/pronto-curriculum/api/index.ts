import app from "@workspace/api-server/app";

// Vercel Serverless Function entry point for the whole Express API.
// The Express app itself is a valid Node request handler `(req, res) => void`,
// so we can hand it straight to Vercel — no Vercel-specific glue needed.
// Every /api/* request is rewritten to /api by vercel.json, which resolves
// to this file; Vercel keeps the original path in req.url, so the Express
// routes mounted under "/api" match unchanged.
export default app;
