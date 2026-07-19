// Vercel Serverless Function entry point for the whole Express API.
// Every /api/* request is rewritten to /api by vercel.json, which resolves
// to this file; Vercel keeps the original path in req.url, so the Express
// routes mounted under "/api" match unchanged.
//
// The app MUST be imported from the prebuilt self-contained bundle, not
// from "@workspace/api-server/app": workspace packages export raw .ts
// sources, which Vercel's function bundler leaves as external bare
// specifiers — at runtime Node then fails with ERR_MODULE_NOT_FOUND on
// node_modules/@workspace/api-server/src/app.ts (verified in the runtime
// logs). The bundle is produced by `pnpm --dir ../api-server run build`
// (see buildCommand in vercel.json) before this file is compiled.
// @ts-expect-error — built artifact, only exists after the api-server build
import app from "../../api-server/dist/app.mjs";

export default app;
