import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, highlightsTable } from "@workspace/db";
import { CreateHighlightBody, UpdateHighlightBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return false;
  }
  return true;
}

router.get("/highlights", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(highlightsTable)
    .where(eq(highlightsTable.userId, userId))
    .orderBy(highlightsTable.createdAt);

  res.json({ highlights: rows });
});

router.post("/highlights", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const parsed = CreateHighlightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, title, description, date, link } = parsed.data;

  const [row] = await db
    .insert(highlightsTable)
    .values({
      userId,
      type,
      title,
      description: description ?? null,
      date: date ?? null,
      link: link ?? null,
    })
    .returning();

  res.status(201).json({ highlight: row });
});

router.put("/highlights/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const id = String(req.params.id);

  const parsed = UpdateHighlightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, title, description, date, link } = parsed.data;

  const [row] = await db
    .update(highlightsTable)
    .set({
      type,
      title,
      description: description ?? null,
      date: date ?? null,
      link: link ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(highlightsTable.id, id), eq(highlightsTable.userId, userId)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Highlight non trovato" });
    return;
  }

  res.json({ highlight: row });
});

router.delete("/highlights/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const id = String(req.params.id);

  const [row] = await db
    .delete(highlightsTable)
    .where(and(eq(highlightsTable.id, id), eq(highlightsTable.userId, userId)))
    .returning({ id: highlightsTable.id });

  if (!row) {
    res.status(404).json({ error: "Highlight non trovato" });
    return;
  }

  res.json({ success: true });
});

export default router;
