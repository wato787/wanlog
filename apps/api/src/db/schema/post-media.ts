/**
 * post_media テーブル
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { posts } from "./posts";

export const postMedia = sqliteTable(
  "post_media",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    mediaUrl: text("media_url").notNull(),
    mediaType: text("media_type", { enum: ["photo", "video"] }).notNull(),
    order: integer("order", { mode: "number" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("post_media_post_id_order_idx").on(t.postId, t.order)],
);

export type PostMedia = typeof postMedia.$inferSelect;
export type NewPostMedia = typeof postMedia.$inferInsert;
