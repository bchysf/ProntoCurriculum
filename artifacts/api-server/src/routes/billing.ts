import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { stripe, STRIPE_PRICES } from "../lib/stripe";

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

// plan: "single" | "monthly" | "annual" | "unlimited-addon"
router.post("/billing/checkout-session", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const { plan } = req.body as { plan?: string };

  const customerId = await getOrCreateCustomer(userId, req.user!.email);

  if (plan === "single") {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICES.singleCv, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${FRONTEND_URL}/dashboard?checkout=cancelled`,
      metadata: { userId, plan: "single" },
    });
    return res.json({ url: session.url });
  }

  if (plan === "monthly" || plan === "annual") {
    const price = plan === "monthly" ? STRIPE_PRICES.monthly100 : STRIPE_PRICES.annualUnlimited;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${FRONTEND_URL}/dashboard?checkout=cancelled`,
      metadata: { userId, plan },
    });
    return res.json({ url: session.url });
  }

  if (plan === "unlimited-addon") {
    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId));

    if (!sub?.stripeSubscriptionId) {
      return res.status(400).json({ error: "Serve un abbonamento mensile attivo prima di aggiungere il pacchetto illimitati" });
    }

    await stripe.subscriptionItems.create({
      subscription: sub.stripeSubscriptionId,
      price: STRIPE_PRICES.unlimitedAddon,
    });

    await db
      .update(subscriptionsTable)
      .set({ unlimitedAddon: true })
      .where(eq(subscriptionsTable.userId, userId));

    return res.json({ ok: true });
  }

  return res.status(400).json({ error: "Piano non valido" });
});

router.get("/billing/status", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId));

  res.json({
    subscription: sub ?? {
      plan: "free",
      status: "inactive",
      unlimitedAddon: false,
      cvCountThisPeriod: 0,
    },
  });
});

export default router;
