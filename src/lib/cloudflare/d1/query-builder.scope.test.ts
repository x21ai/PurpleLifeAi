import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resetRequestBindingsForTests, setRequestBindings } from "../bindings.ts";
import { d1From, scopeColumnForTable } from "./query-builder.ts";

type Captured = { sql: string; params: unknown[] };

const captured: Captured[] = [];

function installFakeDb(allImpl?: () => Promise<{ success: boolean; results: unknown[] }>) {
  captured.length = 0;
  setRequestBindings({
    DB: {
      prepare(sql: string) {
        return {
          bind(...params: unknown[]) {
            captured.push({ sql, params });
            return {
              all: allImpl ?? (async () => ({ success: true, results: [{ id: "user-1" }] })),
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

test("profiles scope by id, other tables by user_id", () => {
  assert.equal(scopeColumnForTable("profiles"), "id");
  assert.equal(scopeColumnForTable("medications"), "user_id");
});

test("profiles select does not reference user_id", async () => {
  installFakeDb();
  const result = await d1From("profiles", "user-1").select("id").limit(5);
  assert.equal(result.error, null);
  assert.equal(Array.isArray(result.data), true);
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

test("profiles insert writes id and does not add user_id", async () => {
  installFakeDb();
  const result = await d1From("profiles", "user-1").insert({ first_name: "A" });
  assert.equal(result.error, null);
  const sql = captured[0]?.sql ?? "";
  assert.match(sql, /INSERT INTO profiles/);
  assert.equal(sql.includes("user_id"), false);
  assert.match(sql, /\bid\b/);
  assert.ok(captured[0]?.params.includes("user-1"));
});

test("maybeSingle returns the D1 error instead of throwing", async () => {
  installFakeDb(async () => {
    throw new Error("no such column: user_id");
  });
  const result = await d1From("profiles", "user-1").maybeSingle();
  assert.equal(result.data, null);
  assert.match(result.error?.message ?? "", /user_id/);
});
