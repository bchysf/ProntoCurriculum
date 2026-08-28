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
  const experienceById = new Map(experienceRows.map((e) => [e.id, e]));
  const orderedExperiences = selectedIds
    .map((id) => experienceById.get(id))
    .filter((e): e is (typeof experienceRows)[number] => !!e);

  const highlightRows = await db.select().from(highlightsTable).where(eq(highlightsTable.userId, profile.userId));

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Profilo professionale";

  const data: PublicProfilePageData = {
    slug: profile.slug,
    fullName,
    photo: profile.photo,
    headline: profile.headline,
    bio: profile.bio,
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

  const requestedLang = String(req.query.lang ?? "IT").toUpperCase();
  const lang = (SUPPORTED_LANGS[requestedLang] ? requestedLang : "IT") as LangCode;
  const finalData = await getTranslatedProfile(data, lang);

  sendHtml(res, renderPublicProfileHtml(finalData, lang));
});

export default router;
