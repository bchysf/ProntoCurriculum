import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, publicProfilesTable, DEFAULT_PUBLIC_PROFILE_SECTIONS, type PublicProfileRow } from "@workspace/db";
import { SavePublicProfileBody } from "@workspace/api-zod";
import { requirePro } from "../middlewares/proGate";
import { generateUniqueSlug } from "../lib/slug";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return false;
  }
  return true;
}

function toEnvelope(row: PublicProfileRow | undefined) {
  if (!row) return { profile: null };
  return {
    profile: {
      ...row,
      publicUrl: row.published ? `https://prontocurriculum.it/p/${row.slug}` : null,
    },
  };
}

router.get("/profile-page", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const [row] = await db
    .select()
    .from(publicProfilesTable)
    .where(eq(publicProfilesTable.userId, userId));

  res.json(toEnvelope(row));
});

router.put("/profile-page", requirePro, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const parsed = SavePublicProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { photo, headline, bio, language, selectedExperienceIds, sections } = parsed.data;

  const [existing] = await db
    .select({ id: publicProfilesTable.id })
    .from(publicProfilesTable)
    .where(eq(publicProfilesTable.userId, userId));

  const patch = {
    photo: photo ?? null,
    headline: headline ?? null,
    bio: bio ?? null,
    language: language ?? "IT",
    selectedExperienceIds: selectedExperienceIds ?? [],
    sections: sections ?? DEFAULT_PUBLIC_PROFILE_SECTIONS,
  };

  let row: PublicProfileRow;
  if (existing) {
    [row] = await db
      .update(publicProfilesTable)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(publicProfilesTable.userId, userId))
      .returning();
  } else {
    const slug = await generateUniqueSlug();
    [row] = await db
      .insert(publicProfilesTable)
      .values({ userId, slug, published: false, ...patch })
      .returning();
  }

  res.json(toEnvelope(row));
});

router.post("/profile-page/publish", requirePro, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [row] = await db
    .update(publicProfilesTable)
    .set({ published: true, updatedAt: new Date() })
    .where(eq(publicProfilesTable.userId, userId))
    .returning();

  if (!row) {
    res.status(400).json({ error: "Salva la tua pagina profilo prima di pubblicarla" });
    return;
  }

  res.json(toEnvelope(row));
});

router.post("/profile-page/unpublish", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const [row] = await db
    .update(publicProfilesTable)
    .set({ published: false, updatedAt: new Date() })
    .where(eq(publicProfilesTable.userId, userId))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Nessuna pagina profilo trovata" });
    return;
  }

  res.json(toEnvelope(row));
});

router.post("/profile-page/regenerate-slug", requirePro, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [existing] = await db
    .select({ id: publicProfilesTable.id })
    .from(publicProfilesTable)
    .where(eq(publicProfilesTable.userId, userId));

  if (!existing) {
    res.status(404).json({ error: "Nessuna pagina profilo trovata" });
    return;
  }

  const slug = await generateUniqueSlug();
  const [row] = await db
    .update(publicProfilesTable)
    .set({ slug, updatedAt: new Date() })
    .where(eq(publicProfilesTable.userId, userId))
    .returning();

  res.json(toEnvelope(row));
});

export default router;
