/**
 * posts テーブル
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { groups } from "./groups";
import { users } from "./users";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    caption: text("caption"),
    takenAt: integer("taken_at", { mode: "number" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("posts_group_id_created_at_idx").on(t.groupId, t.createdAt),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
