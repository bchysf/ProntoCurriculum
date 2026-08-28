// Server-rendered SEO/GEO pages. Mounted at the app root (not under /api) —
// see vercel.json, which rewrites these specific paths to this same
// serverless function instead of falling through to the SPA's index.html.
import { Router, type IRouter } from "express";
import { getHubHtml, getCityHtml } from "../ssr/lombardiaPages";
import { getToolsHubHtml } from "../ssr/toolsPages";

const ssrRouter: IRouter = Router();

ssrRouter.get("/strumenti", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.send(getToolsHubHtml());
});

ssrRouter.get("/lavoro/lombardia", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.send(getHubHtml());
});

ssrRouter.get("/lavoro/lombardia/:city", (req, res) => {
  const html = getCityHtml(req.params["city"] ?? "");
  if (!html) {
    res.status(404).end();
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.send(html);
});

export default ssrRouter;
