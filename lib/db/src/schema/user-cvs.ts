import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userCvsTable = pgTable(
  "user_cvs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull().default("Il mio CV"),
    cvData: jsonb("cv_data").notNull(),
    template: varchar("template", { length: 100 }).notNull().default("modern"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("IDX_user_cvs_user_id").on(table.userId)],
);

export type UserCvRow = typeof userCvsTable.$inferSelect;
export type InsertUserCv = typeof userCvsTable.$inferInsert;
