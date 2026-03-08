/**
 * users テーブル
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    lineId: text("line_id").notNull().unique(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("users_line_id_idx").on(t.lineId)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
