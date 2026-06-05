import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, experiencesTable } from "@workspace/db";
import { CreateExperienceBody, UpdateExperienceBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return false;
  }
  return true;
}

router.get("/experiences", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(experiencesTable)
    .where(eq(experiencesTable.userId, userId))
    .orderBy(experiencesTable.createdAt);

  res.json({ experiences: rows });
});

router.post("/experiences", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const parsed = CreateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { company, role, city, startDate, endDate, isCurrent, description, skills } = parsed.data;

  const [row] = await db
    .insert(experiencesTable)
    .values({
      userId,
      company,
      role,
      city: city ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      isCurrent: isCurrent ?? false,
      description: description ?? null,
      skills: skills ?? [],
    })
    .returning();

  res.status(201).json({ experience: row });
});

router.put("/experiences/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const id = String(req.params.id);

  const parsed = UpdateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { company, role, city, startDate, endDate, isCurrent, description, skills } = parsed.data;

  const [row] = await db
    .update(experiencesTable)
    .set({
      company,
      role,
      city: city ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      isCurrent: isCurrent ?? false,
      description: description ?? null,
      skills: skills ?? [],
      updatedAt: new Date(),
    })
    .where(and(eq(experiencesTable.id, id), eq(experiencesTable.userId, userId)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Esperienza non trovata" });
    return;
  }

  res.json({ experience: row });
});

router.delete("/experiences/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const id = String(req.params.id);

  const [row] = await db
    .delete(experiencesTable)
    .where(and(eq(experiencesTable.id, id), eq(experiencesTable.userId, userId)))
    .returning({ id: experiencesTable.id });

  if (!row) {
    res.status(404).json({ error: "Esperienza non trovata" });
    return;
  }

  res.json({ success: true });
});

export default router;
