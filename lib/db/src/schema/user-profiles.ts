import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userProfilesTable = pgTable("user_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  headline: varchar("headline", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  city: varchar("city", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  website: varchar("website", { length: 255 }),
  summary: text("summary"),
  skills: text("skills").array(),
  education: jsonb("education").$type<Array<{
    id: string;
    institution: string;
    degree: string;
    grade: string;
    from: string;
    to: string;
  }>>().default([]),
  languages: jsonb("languages").$type<Array<{
    id: string;
    name: string;
    level: string;
  }>>().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type UpsertUserProfile = typeof userProfilesTable.$inferInsert;
