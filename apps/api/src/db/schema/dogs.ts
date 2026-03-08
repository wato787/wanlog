/**
 * dogs テーブル
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { groups } from "./groups";

export const dogs = sqliteTable(
  "dogs",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    name: text("name").notNull(),
    breed: text("breed"),
    birthday: text("birthday"),
    iconUrl: text("icon_url"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("dogs_group_id_idx").on(t.groupId)]
);

export type Dog = typeof dogs.$inferSelect;
export type NewDog = typeof dogs.$inferInsert;
