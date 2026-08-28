import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const highlightsTable = pgTable(
  "highlights",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 30 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    date: varchar("date", { length: 50 }),
    link: varchar("link", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("IDX_highlights_user_id").on(table.userId)],
);

export type UpsertHighlight = typeof highlightsTable.$inferInsert;
export type HighlightRow = typeof highlightsTable.$inferSelect;
