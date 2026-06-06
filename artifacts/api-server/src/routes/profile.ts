import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return false;
  }
  return true;
}

router.get("/profile", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const [row] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  res.json({ profile: row ?? null });
});

router.put("/profile", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const {
    headline,
    phone,
    city,
    linkedin,
    website,
    summary,
    skills,
    education,
    languages,
  } = req.body as {
    headline?: string;
    phone?: string;
    city?: string;
    linkedin?: string;
    website?: string;
    summary?: string;
    skills?: string[];
    education?: Array<{ id: string; institution: string; degree: string; grade: string; from: string; to: string }>;
    languages?: Array<{ id: string; name: string; level: string }>;
  };

  const [row] = await db
    .insert(userProfilesTable)
    .values({
      userId,
      headline: headline ?? null,
      phone: phone ?? null,
      city: city ?? null,
      linkedin: linkedin ?? null,
      website: website ?? null,
      summary: summary ?? null,
      skills: skills ?? [],
      education: education ?? [],
      languages: languages ?? [],
    })
    .onConflictDoUpdate({
      target: userProfilesTable.userId,
      set: {
        headline: headline ?? null,
        phone: phone ?? null,
        city: city ?? null,
        linkedin: linkedin ?? null,
        website: website ?? null,
        summary: summary ?? null,
        skills: skills ?? [],
        education: education ?? [],
        languages: languages ?? [],
        updatedAt: new Date(),
      },
    })
    .returning();

  res.json({ profile: row });
});

export default router;
