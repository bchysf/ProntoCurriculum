import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const tailoredCvsTable = pgTable(
  "tailored_cvs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    jobTitle: varchar("job_title", { length: 255 }).notNull().default(""),
    jobDescription: text("job_description").notNull(),
    cvData: jsonb("cv_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("IDX_tailored_cvs_user_id").on(table.userId)],
);

export type TailoredCvRow = typeof tailoredCvsTable.$inferSelect;
export type InsertTailoredCv = typeof tailoredCvsTable.$inferInsert;
