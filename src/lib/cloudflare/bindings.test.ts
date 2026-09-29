import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  getBindings,
  requireD1,
  requireKv,
  requireR2,
  resetRequestBindingsForTests,
  setRequestBindings,
} from "./bindings.ts";

beforeEach(() => {
  resetRequestBindingsForTests();
});

test("preserves D1 when a later process.env-like seed has no DB", () => {
  const fakeDb = { prepare: () => ({}) } as unknown as D1Database;
  setRequestBindings({
    DB: fakeDb,
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "from-worker",
  });
  setRequestBindings({
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "from-process-env",
  });

  assert.equal(getBindings().DB, fakeDb);
  assert.equal(getBindings().AUTH_JWT_SECRET, "from-process-env");
  assert.equal(requireD1(), fakeDb);
});

test("still errors when DB was never seeded", () => {
  setRequestBindings({ DATA_BACKEND: "cloudflare" });
  assert.throws(() => requireD1(), /D1 binding DB is not configured/);
});

test("string-only env does not clobber Worker platform bindings", () => {
  const db = { binding: "db" } as unknown as D1Database;
  const storage = { binding: "storage" } as unknown as R2Bucket;
  const cache = { binding: "cache" } as unknown as KVNamespace;
  const assets = { fetch: async () => new Response("asset") };
  const self = { fetch: async () => new Response("self") };

  setRequestBindings({
    DB: db,
    STORAGE: storage,
    CACHE: cache,
    ASSETS: assets,
    SELF: self,
    PROD: true,
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "worker-secret",
  });

  assert.equal(getBindings().DB, db);

  setRequestBindings({
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "process-secret",
    PUBLIC_SITE_URL: "https://www.purplelife.org",
  });

  const merged = getBindings() as Record<string, unknown>;
  assert.equal(merged.DB, db);
  assert.equal(merged.STORAGE, storage);
  assert.equal(merged.CACHE, cache);
  assert.equal(merged.ASSETS, assets);
  assert.equal(merged.SELF, self);
  assert.equal(merged.PROD, true);
  assert.equal(merged.AUTH_JWT_SECRET, "process-secret");
  assert.equal(merged.DATA_BACKEND, "cloudflare");
  assert.equal(requireD1(), db);
  assert.equal(requireR2(), storage);
  assert.equal(requireKv(), cache);

  setRequestBindings({
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "process-secret",
    DB: "not-a-binding",
    STORAGE: "",
    CACHE: "kv",
  });

  const afterStringStandIns = getBindings() as Record<string, unknown>;
  assert.equal(afterStringStandIns.DB, db);
  assert.equal(afterStringStandIns.STORAGE, storage);
  assert.equal(afterStringStandIns.CACHE, cache);
  assert.equal(requireD1(), db);

  const nextDb = { binding: "db-next" } as unknown as D1Database;
  setRequestBindings({
    DB: nextDb,
    STORAGE: storage,
    CACHE: cache,
    ASSETS: assets,
    DATA_BACKEND: "cloudflare",
    AUTH_JWT_SECRET: "worker-secret",
  });
  assert.equal(getBindings().DB, nextDb);
  assert.equal(requireD1(), nextDb);
});
