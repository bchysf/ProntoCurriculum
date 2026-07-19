import app from "@workspace/api-server/app";

// Vercel Serverless Function entry point for the whole Express API.
// The Express app itself is a valid Node request handler `(req, res) => void`,
// so we can hand it straight to Vercel — no Vercel-specific glue needed.
// This file's [...path] name makes it catch every /api/* request; the
// top-level vercel.json rewrite explicitly excludes /api/ from the SPA
// rewrite so these requests reach this function instead of index.html.
export default app;
