/**
 * テスト用 D1 互換 DB（better-sqlite3 の in-memory）
 */
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../../migrations");

function runMigrations(db: Database.Database) {
  const files = ["0000_lumpy_zaran.sql", "0001_loud_spectrum.sql"];
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    const statements = sql
      .split(/--> statement-breakpoint\n?/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      db.exec(stmt);
    }
  }
}

export function createTestD1(): D1Database {
  const db = new Database(":memory:");
  runMigrations(db);

  const d1 = {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        bind(...params: unknown[]) {
          const run = () => Promise.resolve(stmt.run(...params));
          const all = () => Promise.resolve({ results: stmt.all(...params) as D1Result[] });
          const first = () => {
            const rows = stmt.all(...params) as D1Result[];
            return Promise.resolve(rows[0] ?? null);
          };
          const raw = () => {
            const rows = stmt.all(...params) as Record<string, unknown>[];
            const columns = stmt.columns().map((c) => c.name);
            return Promise.resolve(rows.map((row) => columns.map((col) => row[col])));
          };
          return { run, all, first, raw };
        },
      };
    },
    batch(
      statements: Array<{
        run?: () => Promise<unknown>;
        all?: () => Promise<{ results: unknown[] }>;
      }>
    ) {
      return Promise.all(
        statements.map((s) => (s.all ? s.all() : (s as { run: () => Promise<unknown> }).run()))
      );
    },
    exec() {
      return Promise.resolve({ count: 0, duration: 0 });
    },
  };
  return d1 as unknown as D1Database;
}
