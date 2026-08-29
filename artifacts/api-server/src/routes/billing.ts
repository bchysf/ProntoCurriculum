import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { stripe, STRIPE_PRICES } from "../lib/stripe";
import { isAdminEmail } from "../middlewares/authMiddleware";
import { consumeCvEntitlement } from "../middlewares/proGate";

const router: IRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5180";

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return false;
  }
  return true;
}

async function getOrCreateCustomer(userId: string, email: string | null | undefined) {
  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId));

  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { userId },
  });

  await db
    .insert(subscriptionsTable)
    .values({ userId, stripeCustomerId: customer.id })
    .onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: { stripeCustomerId: customer.id },
    });

  return customer.id;
}

// One-time €1.99 checkout that unlocks one additional CV credit.
router.post("/billing/checkout-session", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const customerId = await getOrCreateCustomer(userId, req.user!.email);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: STRIPE_PRICES.singleCv, quantity: 1 }],
    success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
    cancel_url: `${FRONTEND_URL}/dashboard?checkout=cancelled`,
    metadata: { userId },
  });
  res.json({ url: session.url });
});

// GET /billing/status — entitlement snapshot for the current visitor.
// Safe to call anonymously: returns the "needs an account" shape.
router.get("/billing/status", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ authenticated: false, isAdmin: false, freeTrialUsed: false, credits: 0, canDownloadFree: false });
    return;
  }

  const userId = req.user!.id;
  if (isAdminEmail(req.user!.email)) {
    res.json({ authenticated: true, isAdmin: true, freeTrialUsed: false, credits: Infinity, canDownloadFree: true });
    return;
  }

  const [sub] = await db
    .select({ freeTrialUsed: subscriptionsTable.freeTrialUsed, credits: subscriptionsTable.credits })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId));

  const freeTrialUsed = sub?.freeTrialUsed ?? false;
  const credits = sub?.credits ?? 0;
  res.json({
    authenticated: true,
    isAdmin: false,
    freeTrialUsed,
    credits,
    canDownloadFree: !freeTrialUsed || credits > 0,
  });
});

// POST /billing/consume — spend one entitlement (free trial, then credits) at
// the moment a CV is actually generated. Returns 402 when payment is needed.
router.post("/billing/consume", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const result = await consumeCvEntitlement(req.user!.id, req.user!.email);
  if (!result.ok) {
    res.status(402).json({ error: "Hai esaurito la prova gratuita. Sblocca un altro CV per €1,99.", code: result.reason });
    return;
  }
  res.json({ ok: true, usedFreeTrial: result.usedFreeTrial, remainingCredits: result.remainingCredits });
});

export default router;
