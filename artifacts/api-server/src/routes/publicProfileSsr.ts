// Public, unauthenticated read of a published profile page — mounted at the
// app root (not under /api), see vercel.json's /p/:slug rewrite. Always sends
// X-Robots-Tag: noindex so the page is reachable by direct link only, never
// indexed or listed anywhere on the site.
import { Router, type IRouter, type Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, publicProfilesTable, usersTable, userProfilesTable, experiencesTable, highlightsTable } from "@workspace/db";
import { renderPublicProfileHtml, type PublicProfilePageData, type LangCode } from "../ssr/publicProfilePage";
import { getTranslatedProfile, SUPPORTED_LANGS } from "../lib/translatePublicProfile";

const router: IRouter = Router();

function sendHtml(res: Response, html: string, status = 200): void {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "private, no-store");
  res.send(html);
}

const MONTH_INDEX: Record<string, number> = {
  gen: 1, jan: 1, feb: 2, mar: 3, apr: 4, mag: 5, may: 5, giu: 6, jun: 6,
  lug: 7, jul: 7, ago: 8, aug: 8, set: 9, sep: 9, ott: 10, oct: 10, nov: 11, dic: 12, dec: 12,
};

// Best-effort chronological key for freeform date strings like "Mar 2020",
// "2021", "Gennaio 2019" — used to auto-sort experiences most-recent-first
// since users type dates as free text, not structured values.
function dateSortKey(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const yearMatch = dateStr.match(/\d{4}/);
  if (!yearMatch) return 0;
  const year = parseInt(yearMatch[0], 10);
  const monthMatch = dateStr.toLowerCase().match(/[a-zà-ù]{3,}/);
  const month = monthMatch ? (MONTH_INDEX[monthMatch[0].slice(0, 3)] ?? 0) : 0;
  return year * 12 + month;
}

router.get("/p/:slug", async (req, res) => {
  const slug = String(req.params.slug ?? "");

  const [profile] = await db
    .select()
    .from(publicProfilesTable)
    .where(eq(publicProfilesTable.slug, slug));

  if (!profile || !profile.published) {
    sendHtml(res, "<!DOCTYPE html><html lang=\"it\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex\"><title>Pagina non trovata</title></head><body>Pagina non trovata.</body></html>", 404);
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId));
  const [userProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, profile.userId));

  const selectedIds = profile.selectedExperienceIds ?? [];
  const experienceRows = selectedIds.length
    ? await db.select().from(experiencesTable).where(inArray(experiencesTable.id, selectedIds))
    : [];
  const selectedIdSet = new Set(selectedIds);
  // Always chronological (current roles first, then most recent start date) —
  // free-text dates mean users can't reliably hand-order these themselves.
  const orderedExperiences = experienceRows
    .filter((e) => selectedIdSet.has(e.id))
    .sort((a, b) => {
      if (!!a.isCurrent !== !!b.isCurrent) return a.isCurrent ? -1 : 1;
      return dateSortKey(b.startDate) - dateSortKey(a.startDate);
    });

  const highlightRows = await db.select().from(highlightsTable).where(eq(highlightsTable.userId, profile.userId));

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Profilo professionale";

  const data: PublicProfilePageData = {
    slug: profile.slug,
    fullName,
    photo: profile.photo,
    headline: profile.headline,
    bio: profile.bio,
    city: userProfile?.city,
    phone: userProfile?.phone,
    email: user?.email,
    linkedin: userProfile?.linkedin,
    website: userProfile?.website,
    sections: profile.sections,
    experiences: orderedExperiences.map((e) => ({
      company: e.company,
      role: e.role,
      city: e.city,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
      skills: e.skills,
    })),
    highlights: highlightRows.map((h) => ({
      type: h.type,
      title: h.title,
      description: h.description,
      date: h.date,
      link: h.link,
    })),
    education: userProfile?.education ?? [],
    languages: userProfile?.languages ?? [],
    skills: userProfile?.skills ?? [],
    updatedAt: profile.updatedAt?.toISOString(),
  };

  const lang = (SUPPORTED_LANGS[profile.language] ? profile.language : "IT") as LangCode;
  const finalData = await getTranslatedProfile(data, lang);

  sendHtml(res, renderPublicProfileHtml(finalData, lang));
});

export default router;
