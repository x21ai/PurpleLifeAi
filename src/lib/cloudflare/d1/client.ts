import { requireD1 } from "../bindings";

export type D1Row = Record<string, unknown>;

export async function d1All<T extends D1Row = D1Row>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const stmt = requireD1().prepare(sql);
  const result = await stmt.bind(...params).all<T>();
  if (!result.success) {
    throw new Error(result.error ?? "D1 query failed");
  }
  return result.results ?? [];
}

export async function d1First<T extends D1Row = D1Row>(
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = requireD1().prepare(sql);
  return stmt.bind(...params).first<T>();
}

export async function d1Run(
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  const stmt = requireD1().prepare(sql);
  return stmt.bind(...params).run();
}

export async function d1Batch(
  statements: Array<{ sql: string; params?: unknown[] }>,
): Promise<D1Result[]> {
  const db = requireD1();
  const prepared = statements.map(({ sql, params = [] }) =>
    db.prepare(sql).bind(...params),
  );
  return db.batch(prepared);
}

/** Scope helper: every user-owned query must include user_id = ? */
export function assertUserScope(userId: string, rowUserId: unknown): void {
  if (rowUserId !== userId) {
    throw new Error("Not found");
  }
}
