/**
 * Care chat poll returns rows newer than `since` for a participant.
 */
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Database } from "bun:sqlite";
import { resetRequestBindingsForTests, setRequestBindings } from "../bindings.ts";
import { listCareMessagesSince } from "./care-live.ts";

function careDb(): D1Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE care_thread_participants (
      thread_id TEXT,
      user_id TEXT
    );
    CREATE TABLE care_messages (
      id TEXT,
      thread_id TEXT,
      sender_id TEXT,
      body TEXT,
      attachments TEXT,
      created_at TEXT,
      deleted_at TEXT
    );
  `);
  db.exec(`
    INSERT INTO care_thread_participants (thread_id, user_id) VALUES ('thread-1', 'user-1');
    INSERT INTO care_messages (id, thread_id, sender_id, body, created_at)
    VALUES ('m1', 'thread-1', 'user-1', 'earlier', '2026-10-03T12:00:00.000Z');
    INSERT INTO care_messages (id, thread_id, sender_id, body, created_at)
    VALUES ('m2', 'thread-1', 'user-2', 'later', '2026-10-03T12:00:02.000Z');
  `);
  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          const args = params as never[];
          return {
            async first<T>() {
              return (db.query(sql).get(...args) as T | null) ?? null;
            },
            async all<T>() {
              return { success: true, results: db.query(sql).all(...args) as T[] };
            },
            async run() {
              const info = db.query(sql).run(...args);
              return { success: true, meta: { changes: info.changes } };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}

beforeEach(() => {
  resetRequestBindingsForTests();
  setRequestBindings({
    DB: careDb(),
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "test-secret-not-a-real-key",
  });
});

test("a participant sees only messages after since", async () => {
  const rows = await listCareMessagesSince({
    userId: "user-1",
    threadId: "thread-1",
    since: "2026-10-03T12:00:00.000Z",
  });
  assert.ok(Array.isArray(rows));
  if (!Array.isArray(rows)) return;
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.body, "later");
});

test("someone outside the thread gets 404", async () => {
  const rows = await listCareMessagesSince({
    userId: "user-9",
    threadId: "thread-1",
    since: "1970-01-01T00:00:00.000Z",
  });
  assert.ok(!Array.isArray(rows));
  if (Array.isArray(rows)) return;
  assert.equal(rows.status, 404);
});
