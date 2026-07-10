import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { stripe, STRIPE_PRICES } from "../lib/stripe";
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
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;
          if (!userId) break;

          if (session.mode === "subscription" && session.subscription) {
            const subscriptionId =
              typeof session.subscription === "string" ? session.subscription : session.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await db
              .update(subscriptionsTable)
              .set({
                stripeSubscriptionId: subscription.id,
                plan: plan === "annual" ? "annual" : "monthly",
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.items.data[0]!.current_period_end * 1000),
                cvCountThisPeriod: 0,
              })
              .where(eq(subscriptionsTable.userId, userId));
          }
          // mode === "payment" (single CV) is fulfilled client-side by re-checking
          // /billing/status → cvCountThisPeriod is not touched; single downloads are
          // tracked by the caller unlocking that one CV export.
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId ?? (await lookupUserId(subscription.customer as string));
          if (!userId) break;

          const hasAddon = subscription.items.data.some((item) => item.price.id === STRIPE_PRICES.unlimitedAddon);

          await db
            .update(subscriptionsTable)
            .set({
              status: subscription.status,
              unlimitedAddon: hasAddon,
              currentPeriodEnd: new Date(subscription.items.data[0]!.current_period_end * 1000),
            })
            .where(eq(subscriptionsTable.userId, userId));
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId ?? (await lookupUserId(subscription.customer as string));
          if (!userId) break;

          await db
            .update(subscriptionsTable)
            .set({ plan: "free", status: "canceled", unlimitedAddon: false, stripeSubscriptionId: null })
            .where(eq(subscriptionsTable.userId, userId));
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.billing_reason === "subscription_cycle") {
            const userId = await lookupUserId(invoice.customer as string);
            if (!userId) break;
            await db
              .update(subscriptionsTable)
              .set({ cvCountThisPeriod: 0 })
              .where(eq(subscriptionsTable.userId, userId));
          }
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

async function lookupUserId(stripeCustomerId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: subscriptionsTable.userId })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeCustomerId, stripeCustomerId));
  return row?.userId ?? null;
}

export default router;
