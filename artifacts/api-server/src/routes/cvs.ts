import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { userCvsTable, experiencesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();
const MAX_SAVED_CVS = 20;

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Autenticazione richiesta" });
    return null;
  }
  return userId;
}

interface CVExperience {
  company?: string;
  role?: string;
  city?: string;
  from?: string;
  to?: string;
  desc?: string;
}

function normalizeStr(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

async function syncExperiencesFromCV(
  userId: string,
  cvData: unknown,
  log: { error: (obj: object, msg: string) => void }
): Promise<void> {
  try {
    const data = cvData as Record<string, unknown>;
    const experiences = data?.experiences as CVExperience[] | undefined;
    if (!Array.isArray(experiences) || experiences.length === 0) return;

    const existing = await db
      .select({
        company: experiencesTable.company,
        role: experiencesTable.role,
        startDate: experiencesTable.startDate,
      })
      .from(experiencesTable)
      .where(eq(experiencesTable.userId, userId));

    for (const exp of experiences) {
      if (!exp.company?.trim() || !exp.role?.trim()) continue;

      const c = normalizeStr(exp.company);
      const r = normalizeStr(exp.role);
      const s = normalizeStr(exp.from);

      const isDuplicate = existing.some(
        (e) =>
          normalizeStr(e.company) === c &&
          normalizeStr(e.role) === r &&
          normalizeStr(e.startDate) === s
      );
      if (isDuplicate) continue;

      const isCurrent = /presente|present|heute|actuel|actual/i.test(exp.to ?? "");

      const inserted = await db
        .insert(experiencesTable)
        .values({
          userId,
          company: exp.company.trim(),
          role: exp.role.trim(),
          city: exp.city?.trim() || null,
          startDate: exp.from?.trim() || null,
          endDate: isCurrent ? null : (exp.to?.trim() || null),
          isCurrent,
          description: exp.desc?.trim() || null,
          skills: [],
        })
        .returning({ company: experiencesTable.company, role: experiencesTable.role, startDate: experiencesTable.startDate });

      if (inserted[0]) {
        existing.push(inserted[0]);
      }
    }
  } catch (err) {
    log.error({ err }, "syncExperiencesFromCV error");
  }
}

router.get("/cvs", async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  try {
    const cvs = await db
      .select()
      .from(userCvsTable)
      .where(eq(userCvsTable.userId, userId))
      .orderBy(desc(userCvsTable.updatedAt));
    res.json({ cvs });
  } catch (err) {
    req.log.error({ err }, "GET /cvs error");
    res.status(500).json({ error: "Errore nel caricamento dei CV" });
  }
});

router.post("/cvs", async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const { name, cvData, template } = req.body as {
    name?: string;
    cvData?: unknown;
    template?: string;
  };
  if (!cvData) {
    res.status(400).json({ error: "cvData mancante" });
    return;
  }

  try {
    const existing = await db
      .select({ id: userCvsTable.id })
      .from(userCvsTable)
      .where(eq(userCvsTable.userId, userId))
      .orderBy(desc(userCvsTable.updatedAt));

    if (existing.length >= MAX_SAVED_CVS) {
      for (const row of existing.slice(MAX_SAVED_CVS - 1)) {
        await db.delete(userCvsTable).where(eq(userCvsTable.id, row.id));
      }
    }

    const [inserted] = await db
      .insert(userCvsTable)
      .values({
        userId,
        name: name?.trim() || "Il mio CV",
        cvData: cvData as Record<string, unknown>,
        template: template ?? "modern",
      })
      .returning();

    await syncExperiencesFromCV(userId, cvData, req.log);

    res.json({ cv: inserted });
  } catch (err) {
    req.log.error({ err }, "POST /cvs error");
    res.status(500).json({ error: "Errore nel salvataggio del CV" });
  }
});

router.put("/cvs/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const id = String(req.params.id);
  const { name, cvData, template } = req.body as {
    name?: string;
    cvData?: unknown;
    template?: string;
  };

  try {
    const patch: Partial<typeof userCvsTable.$inferInsert> = { updatedAt: new Date() };
    if (name !== undefined) patch.name = name.trim() || "Il mio CV";
    if (cvData !== undefined) patch.cvData = cvData as Record<string, unknown>;
    if (template !== undefined) patch.template = template;

    const [updated] = await db
      .update(userCvsTable)
      .set(patch)
      .where(and(eq(userCvsTable.id, id), eq(userCvsTable.userId, userId)))
      .returning();

    if (!updated) { res.status(404).json({ error: "CV non trovato" }); return; }

    if (cvData !== undefined) {
      await syncExperiencesFromCV(userId, cvData, req.log);
    }

    res.json({ cv: updated });
  } catch (err) {
    req.log.error({ err }, "PUT /cvs/:id error");
    res.status(500).json({ error: "Errore nell'aggiornamento" });
  }
});

router.delete("/cvs/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const id = String(req.params.id);
  try {
    const [deleted] = await db
      .delete(userCvsTable)
      .where(and(eq(userCvsTable.id, id), eq(userCvsTable.userId, userId)))
      .returning({ id: userCvsTable.id });

    if (!deleted) { res.status(404).json({ error: "CV non trovato" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /cvs/:id error");
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
});

export default router;
