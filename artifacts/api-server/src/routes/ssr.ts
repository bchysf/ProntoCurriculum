// Server-rendered SEO/GEO pages. Mounted at the app root (not under /api) —
// see vercel.json, which rewrites these specific paths to this same
// serverless function instead of falling through to the SPA's index.html.
import { Router, type IRouter, type Response } from "express";
import { getHubHtml, getCityHtml } from "../ssr/lombardiaPages";
import { getToolsHubHtml } from "../ssr/toolsPages";
import { getProfessionHtml } from "../ssr/professionPages";

const ssrRouter: IRouter = Router();

function sendHtml(res: Response, html: string): void {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.send(html);
}

ssrRouter.get("/strumenti", (_req, res) => {
  sendHtml(res, getToolsHubHtml());
});

ssrRouter.get("/lavoro/lombardia", (_req, res) => {
  sendHtml(res, getHubHtml());
});

// /lavoro/lombardia/:segment is either a regional profession spoke
// (e.g. cv-infermiere) or a city hub page — checked in that order so a
// profession slug never gets misread as an unknown city.
ssrRouter.get("/lavoro/lombardia/:segment", (req, res) => {
  const segment = req.params["segment"] ?? "";
  const professionHtml = getProfessionHtml(null, segment);
  if (professionHtml) {
    sendHtml(res, professionHtml);
    return;
  }
  const cityHtml = getCityHtml(segment);
  if (!cityHtml) {
    res.status(404).end();
    return;
  }
  sendHtml(res, cityHtml);
});

// City-scoped profession spokes, e.g. /lavoro/lombardia/milano/cv-sviluppatore-software.
ssrRouter.get("/lavoro/lombardia/:city/:profession", (req, res) => {
  const html = getProfessionHtml(req.params["city"] ?? "", req.params["profession"] ?? "");
  if (!html) {
    res.status(404).end();
    return;
  }
  sendHtml(res, html);
});

export default ssrRouter;
