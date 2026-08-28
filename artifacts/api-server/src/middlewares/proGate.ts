import { type Request, type Response, type NextFunction } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { isAdminEmail } from "./authMiddleware";

// The site admin gets Pro perks unconditionally — they shouldn't need a
// subscriptionsTable row (Stripe or manually granted) just to use their own app.
export async function isProUser(userId: string | undefined, email?: string | null): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  if (!userId) return false;
  const [sub] = await db
    .select({ plan: subscriptionsTable.plan })
    .from(subscriptionsTable)
    .where(
      sql`${subscriptionsTable.userId} = ${userId} and ${subscriptionsTable.status} = 'active' and ${subscriptionsTable.plan} <> 'free' and ${subscriptionsTable.currentPeriodEnd} > now()`
    );
  return !!sub;
}

export async function requirePro(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }
  const isPro = await isProUser(req.user.id, req.user.email);
  if (!isPro) {
    res.status(403).json({
      error: "Funzione riservata agli utenti Pro",
      code: "PRO_REQUIRED",
    });
    return;
  }
  next();
}
