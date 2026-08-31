import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const coverLettersTable = pgTable(
  "cover_letters",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    jobTitle: varchar("job_title", { length: 255 }).notNull().default(""),
    companyName: varchar("company_name", { length: 255 }).notNull().default(""),
    tone: varchar("tone", { length: 32 }).notNull().default("human"),
    letterData: jsonb("letter_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("IDX_cover_letters_user_id").on(table.userId)],
);

export type CoverLetterRow = typeof coverLettersTable.$inferSelect;
export type InsertCoverLetter = typeof coverLettersTable.$inferInsert;
