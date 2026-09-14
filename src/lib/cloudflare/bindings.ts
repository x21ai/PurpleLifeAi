import type { PurpleWorkerBindings } from "./env";
import { getWorkerBindings } from "./env";

let cachedBindings: Partial<PurpleWorkerBindings> | undefined;

/** Request-scoped or module-scoped bindings from the active Worker env. */
export function setRequestBindings(env: unknown): void {
  cachedBindings = getWorkerBindings(env);
}

export function getBindings(): Partial<PurpleWorkerBindings> {
  return cachedBindings ?? getWorkerBindings(undefined);
}

export function requireD1(): D1Database {
  const db = getBindings().DB;
  if (!db) {
    throw new Error(
      "D1 binding DB is not configured. Add d1_databases to wrangler and deploy.",
    );
  }
  return db;
}

export function requireR2(): R2Bucket {
  const bucket = getBindings().STORAGE;
  if (!bucket) {
    throw new Error(
      "R2 binding STORAGE is not configured. Add r2_buckets to wrangler and deploy.",
    );
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
