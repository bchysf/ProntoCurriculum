import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable, usersTable } from "@workspace/db";
import { syncProfileFromCv } from "../lib/profileSync";

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

  const [[row], [user]] = await Promise.all([
    db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)),
    db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, userId)),
  ]);

  res.json({
    profile: row ?? null,
    // The account name is locked once set — one account is one person, so
    // the frontend uses this to know whether the name field can be edited.
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    nameLocked: !!(user?.firstName || user?.lastName),
    email: user?.email ?? null,
  });
});

router.put("/profile", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const {
    firstName,
    lastName,
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
    firstName?: string;
    lastName?: string;
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

  // Name can only be set once per account — once either field is non-empty,
  // further attempts to change it are silently ignored rather than erroring,
  // so a stale form submit from before it was locked doesn't fail the whole save.
  if (firstName !== undefined || lastName !== undefined) {
    const [user] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (user && !user.firstName && !user.lastName) {
      await db.update(usersTable)
        .set({ firstName: firstName || null, lastName: lastName || null })
        .where(eq(usersTable.id, userId));
    }
  }

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

// POST /api/profile/sync-from-cv — fire-and-forget from the client-side PDF
// download path (which has no other server round-trip to piggyback on),
// so downloading a CV saves its contact/skills/etc. for next time same as
// saving or a DOCX download already does.
router.post("/profile/sync-from-cv", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { cvData } = req.body as { cvData?: Parameters<typeof syncProfileFromCv>[1] };
  if (!cvData) {
    res.status(400).json({ error: "cvData mancante" });
    return;
  }
  try {
    await syncProfileFromCv(req.user!.id, cvData);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Errore durante il salvataggio del profilo" });
  }
});

export default router;
