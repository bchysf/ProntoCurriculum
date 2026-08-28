import { sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export type PublicProfileSection = {
  key: "experiences" | "education" | "languages" | "skills" | "highlights";
  visible: boolean;
  order: number;
};

export const DEFAULT_PUBLIC_PROFILE_SECTIONS: PublicProfileSection[] = [
  { key: "experiences", visible: true, order: 0 },
  { key: "highlights", visible: true, order: 1 },
  { key: "education", visible: true, order: 2 },
  { key: "skills", visible: true, order: 3 },
  { key: "languages", visible: true, order: 4 },
];

export const publicProfilesTable = pgTable("public_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 12 }).notNull().unique(),
  published: boolean("published").notNull().default(false),
  photo: text("photo"),
  headline: varchar("headline", { length: 255 }),
  bio: text("bio"),
  selectedExperienceIds: text("selected_experience_ids").array(),
  sections: jsonb("sections")
    .$type<PublicProfileSection[]>()
    .notNull()
    .default(DEFAULT_PUBLIC_PROFILE_SECTIONS),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UpsertPublicProfile = typeof publicProfilesTable.$inferInsert;
export type PublicProfileRow = typeof publicProfilesTable.$inferSelect;
