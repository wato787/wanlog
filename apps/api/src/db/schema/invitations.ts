/**
 * invitations テーブル
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { groups } from "./groups";

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "number" }).notNull(),
    usedAt: integer("used_at", { mode: "number" }),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("invitations_token_idx").on(t.token)]
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
