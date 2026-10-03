/**
 * In-memory D1 for auth tests. Uses bun:sqlite. Never points at production.
 */
import { Database } from "bun:sqlite";

const AUTH_USERS = `
CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  email_confirmed_at TEXT,
  phone_confirmed_at TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_sign_in_at TEXT,
  user_metadata TEXT NOT NULL DEFAULT '{}',
  app_metadata TEXT NOT NULL DEFAULT '{}',
  banned_until TEXT,
  deleted_at TEXT
);
`;

export function createMemoryD1(): D1Database {
  const db = new Database(":memory:");
  db.exec(AUTH_USERS);
  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          const args = params as never[];
          return {
            async first<T>() {
              const row = db.query(sql).get(...args) as T | null;
              return row ?? null;
            },
            async all<T>() {
              const results = db.query(sql).all(...args) as T[];
              return { success: true, results };
            },
            async run() {
              const info = db.query(sql).run(...args);
              return {
                success: true,
                meta: { changes: info.changes, duration: 0 },
              };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}
