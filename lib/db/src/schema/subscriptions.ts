import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const subscriptionsTable = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // "free" | "monthly" | "annual"
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  // true when the unlimited add-on price item is active on the subscription
  unlimitedAddon: boolean("unlimited_addon").notNull().default(false),
  status: varchar("status", { length: 30 }).notNull().default("inactive"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cvCountThisPeriod: integer("cv_count_this_period").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SubscriptionRow = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
