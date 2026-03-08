/**
 * Drizzle スキーマ（Phase 2-1 で全テーブル定義を追加）
 * ローカル D1 接続確認用に最小限のテーブルを定義
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const _drizzleMigrationsCheck = sqliteTable("_drizzle_migrations_check", {
  id: text("id").primaryKey(),
});
