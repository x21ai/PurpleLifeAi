import type { PurpleWorkerBindings } from "./env";
import { getWorkerBindings } from "./env";

let cachedBindings: Partial<PurpleWorkerBindings> | undefined;

/**
 * Platform bindings (D1, R2, KV, ASSETS, PROD, service bindings) are objects
 * or booleans. Workers copy only strings onto process.env, so a later
 * setRequestBindings(process.env) must not drop them.
 *
 * String secrets such as AUTH_JWT_SECRET are kept when that later pass omits
 * them (null, undefined, or ""). An explicit non-empty string still replaces
 * the previous value.
 */
function isOmittedString(value: unknown): boolean {
  return value == null || value === "";
}

function mergeBindings(
  previous: Partial<PurpleWorkerBindings> | undefined,
  incoming: Partial<PurpleWorkerBindings>,
): Partial<PurpleWorkerBindings> {
  if (!previous) return incoming;

  const preserved: Record<string, unknown> = {};
  const incomingRecord = incoming as Record<string, unknown>;
  for (const [key, value] of Object.entries(previous)) {
    if (value == null || value === "") continue;
    const next = incomingRecord[key];
    if (typeof value === "string") {
      if (isOmittedString(next)) preserved[key] = value;
      continue;
    }
    if (next == null || typeof next === "string") {
      preserved[key] = value;
    }
  }

  return { ...incoming, ...(preserved as Partial<PurpleWorkerBindings>) };
}

/** Request-scoped or module-scoped bindings from the active Worker env. */
export function setRequestBindings(env: unknown): void {
  cachedBindings = mergeBindings(cachedBindings, getWorkerBindings(env));
}

export function getBindings(): Partial<PurpleWorkerBindings> {
  return cachedBindings ?? getWorkerBindings(undefined);
}

/** Test helper: clear the module cache between unit cases. */
export function resetRequestBindingsForTests(): void {
  cachedBindings = undefined;
}

export function requireD1(): D1Database {
  const db = getBindings().DB;
  if (!db) {
    throw new Error("D1 binding DB is not configured. Add d1_databases to wrangler and deploy.");
  }
  return db;
}

export function requireR2(): R2Bucket {
  const bucket = getBindings().STORAGE;
  if (!bucket) {
    throw new Error("R2 binding STORAGE is not configured. Add r2_buckets to wrangler and deploy.");
  }
  return bucket;
}

export function requireKv(): KVNamespace {
  const kv = getBindings().CACHE;
  if (!kv) {
    throw new Error(
      "KV binding CACHE is not configured. Add kv_namespaces to wrangler and deploy.",
    );
  }
  return kv;
}
