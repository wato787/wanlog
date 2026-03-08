/**
 * replies テーブル
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { posts } from "./posts";
import { users } from "./users";

export const replies = sqliteTable(
  "replies",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("replies_post_id_idx").on(t.postId)]
);

export type Reply = typeof replies.$inferSelect;
export type NewReply = typeof replies.$inferInsert;
