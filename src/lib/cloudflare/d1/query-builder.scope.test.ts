import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resetRequestBindingsForTests, setRequestBindings } from "../bindings.ts";
import { d1From } from "./query-builder.ts";

type Captured = { sql: string; params: unknown[] };

const captured: Captured[] = [];

function installFakeDb() {
  captured.length = 0;
  setRequestBindings({
    DB: {
      prepare(sql: string) {
        return {
          bind(...params: unknown[]) {
            captured.push({ sql, params });
            return {
              all: async () => ({ success: true, results: [{ id: "user-1" }] }),
              first: async () => null,
              run: async () => ({ success: true, meta: {} }),
            };
          },
        };
      },
    } as unknown as D1Database,
  });
}

beforeEach(() => {
  resetRequestBindingsForTests();
  captured.length = 0;
});

test("profiles select scopes by id", async () => {
  installFakeDb();
  const result = await d1From("profiles", "user-1").select("id").limit(5);
  assert.equal(result.error, null);
  const sql = captured[0]?.sql ?? "";
  assert.match(sql, /FROM profiles/);
  assert.match(sql, /WHERE id = \?/);
  assert.equal(sql.includes("user_id"), false);
  assert.deepEqual(captured[0]?.params, ["user-1"]);
});

test("medications select still scopes by user_id", async () => {
  installFakeDb();
  const result = await d1From("medications", "user-1").select("id").limit(5);
  assert.equal(result.error, null);
  const sql = captured[0]?.sql ?? "";
  assert.match(sql, /WHERE user_id = \?/);
  assert.deepEqual(captured[0]?.params, ["user-1"]);
});

test("profiles upsert writes id and does not add user_id", async () => {
  installFakeDb();
  const result = await d1From("profiles", "user-1").upsert(
    { display_name: "Ada" },
    { onConflict: "id" },
  );
  assert.equal(result.error, null);
  const sql = captured[0]?.sql ?? "";
  assert.match(sql, /INSERT INTO profiles \(display_name, id\)/);
  assert.equal(sql.includes("user_id"), false);
  assert.deepEqual(captured[0]?.params, ["Ada", "user-1"]);
});

test("health_narratives upsert still writes user_id", async () => {
  installFakeDb();
  const result = await d1From("health_narratives", "user-1").upsert(
    { day: "2026-09-29", narrative: "ok" },
    { onConflict: "user_id,day" },
  );
  assert.equal(result.error, null);
  const sql = captured[0]?.sql ?? "";
  assert.match(sql, /INSERT INTO health_narratives \(day, narrative, user_id\)/);
  assert.match(sql, /ON CONFLICT\(user_id, day\)/);
  assert.deepEqual(captured[0]?.params, ["2026-09-29", "ok", "user-1"]);
});
