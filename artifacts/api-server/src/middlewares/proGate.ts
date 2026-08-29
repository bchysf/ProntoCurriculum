import { type Request, type Response, type NextFunction } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { isAdminEmail } from "./authMiddleware";

export interface Entitlement {
  freeTrialUsed: boolean;
  credits: number;
}

async function getEntitlement(userId: string): Promise<Entitlement> {
  const [row] = await db
    .select({ freeTrialUsed: subscriptionsTable.freeTrialUsed, credits: subscriptionsTable.credits })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId));
  return row ?? { freeTrialUsed: false, credits: 0 };
}

// The site admin always has access — no row needed.
export async function hasCvEntitlement(userId: string | undefined, email?: string | null): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  if (!userId) return false;
  const { freeTrialUsed, credits } = await getEntitlement(userId);
  return !freeTrialUsed || credits > 0;
}

// Kept for docx export gating, which only needs a yes/no on "does this user get
// a clean (non-watermarked) file right now" without spending anything.
export const isProUser = hasCvEntitlement;

export type ConsumeResult =
  | { ok: true; usedFreeTrial: boolean; remainingCredits: number }
  | { ok: false; reason: "NEEDS_PAYMENT" };

// Atomically spends one entitlement: a paid credit if available, otherwise the
// single free trial. Returns NEEDS_PAYMENT if neither is available.
export async function consumeCvEntitlement(userId: string, email?: string | null): Promise<ConsumeResult> {
  if (isAdminEmail(email)) return { ok: true, usedFreeTrial: false, remainingCredits: Infinity };

  await db
    .insert(subscriptionsTable)
    .values({ userId })
    .onConflictDoNothing({ target: subscriptionsTable.userId });

  const [spentCredit] = await db
    .update(subscriptionsTable)
    .set({ credits: sql`${subscriptionsTable.credits} - 1` })
    .where(sql`${subscriptionsTable.userId} = ${userId} and ${subscriptionsTable.credits} > 0`)
    .returning({ credits: subscriptionsTable.credits });

  if (spentCredit) {
    return { ok: true, usedFreeTrial: false, remainingCredits: spentCredit.credits };
  }

  const [spentTrial] = await db
    .update(subscriptionsTable)
    .set({ freeTrialUsed: true })
    .where(sql`${subscriptionsTable.userId} = ${userId} and ${subscriptionsTable.freeTrialUsed} = false`)
    .returning({ credits: subscriptionsTable.credits });

  if (spentTrial) {
    return { ok: true, usedFreeTrial: true, remainingCredits: spentTrial.credits };
  }

  return { ok: false, reason: "NEEDS_PAYMENT" };
}

export async function requirePro(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }
  const has = await hasCvEntitlement(req.user.id, req.user.email);
  if (!has) {
    res.status(403).json({
      error: "Funzione riservata agli utenti con credito CV disponibile",
      code: "PRO_REQUIRED",
    });
    return;
  }
  next();
}
