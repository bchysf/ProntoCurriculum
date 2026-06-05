import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const experiencesTable = pgTable(
  "experiences",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    company: varchar("company", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }),
    startDate: varchar("start_date", { length: 50 }),
    endDate: varchar("end_date", { length: 50 }),
    isCurrent: boolean("is_current").default(false),
    description: text("description"),
    skills: text("skills").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("IDX_experiences_user_id").on(table.userId)],
);

export type UpsertExperience = typeof experiencesTable.$inferInsert;
export type ExperienceRow = typeof experiencesTable.$inferSelect;
