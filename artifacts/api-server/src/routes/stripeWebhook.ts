import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import { sql } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { stripe } from "../lib/stripe";
import { logger } from "../lib/logger";
import type Stripe from "stripe";

const router: IRouter = Router();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  logger.warn("STRIPE_WEBHOOK_SECRET is not set — /api/webhooks/stripe will reject all events until configured");
}

router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!webhookSecret) {
      return res.status(500).send("Webhook not configured");
    }

    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      logger.warn({ err }, "Stripe webhook signature verification failed");
      return res.status(400).send("Invalid signature");
    }

    try {
      switch (event.type) {
        // The only paid product is a one-time €1.99 CV credit — on successful
        // payment, add one credit to the buyer's account.
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          if (!userId || session.mode !== "payment" || session.payment_status !== "paid") break;

          await db
            .insert(subscriptionsTable)
            .values({ userId, credits: 1 })
            .onConflictDoUpdate({
              target: subscriptionsTable.userId,
              set: { credits: sql`${subscriptionsTable.credits} + 1`, updatedAt: new Date() },
            });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      logger.error({ err, eventType: event.type }, "Failed to process Stripe webhook event");
      return res.status(500).send("Webhook handler error");
    }

    return res.json({ received: true });
  },
);

export default router;
