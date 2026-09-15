/**
 * Browser-side query builder: proxies to POST /api/data/query.
 */
import { getCloudflareSession } from "@/lib/auth/cloudflare-session";
import type { ParsedOrClause } from "./filter-parser";
import { parseOrFilter } from "./filter-parser";

type Filter =
  | { op: "eq"; col: string; val: unknown }
  | { op: "gte"; col: string; val: unknown }
  | { op: "lte"; col: string; val: unknown }
  | { op: "gt"; col: string; val: unknown }
  | { op: "lt"; col: string; val: unknown }
  | { op: "in"; col: string; val: unknown[] }
  | { op: "is"; col: string; val: null };

export class ApiQueryBuilder<T = Record<string, unknown>> {
  private filters: Filter[] = [];
  private orGroups: ParsedOrClause[][] = [];
  private orderBy: { col: string; ascending: boolean }[] = [];
  private limitN: number | null = null;
  private selectCols = "*";
  private countExact = false;
  private countHead = false;
  private insertRow: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateRow: Record<string, unknown> | null = null;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private returnSelect: string | null = null;

  constructor(private table: string) {}

  select(cols: string, opts?: { count?: "exact"; head?: boolean }): this {
    if (this.mode === "insert" || this.mode === "update") {
      this.returnSelect = cols;
      return this;
    }
    if (opts?.count === "exact") this.countExact = true;
    if (opts?.head) this.countHead = true;
    if (!opts?.count) this.selectCols = cols.trim();
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push({ op: "eq", col, val });
    return this;
  }

  gte(col: string, val: unknown): this {
    this.filters.push({ op: "gte", col, val });
    return this;
  }

  lte(col: string, val: unknown): this {
    this.filters.push({ op: "lte", col, val });
    return this;
  }

  gt(col: string, val: unknown): this {
    this.filters.push({ op: "gt", col, val });
    return this;
  }

  lt(col: string, val: unknown): this {
    this.filters.push({ op: "lt", col, val });
    return this;
  }

  is(col: string, val: null): this {
    this.filters.push({ op: "is", col, val });
    return this;
  }

  or(filter: string): this {
    const clauses = parseOrFilter(filter);
    if (clauses.length) this.orGroups.push(clauses);
    return this;
  }

  in(col: string, val: unknown[]): this {
    this.filters.push({ op: "in", col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  insert(row: Record<string, unknown> | Record<string, unknown>[]): this {
    this.mode = "insert";
    this.insertRow = row;
    return this;
  }

  update(row: Record<string, unknown>): this {
    this.mode = "update";
    this.updateRow = row;
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  private authHeaders(): Record<string, string> {
    const token = getCloudflareSession()?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async run(): Promise<{
    data: T[] | T | null;
    error: Error | null;
    count?: number | null;
  }> {
    const res = await fetch("/api/data/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify({
        table: this.table,
        mode: this.mode,
        select: this.selectCols,
        returnSelect: this.returnSelect,
        filters: this.filters,
        orGroups: this.orGroups,
        order: this.orderBy,
        limit: this.limitN,
        countExact: this.countExact,
        countHead: this.countHead,
        insert: this.insertRow,
        update: this.updateRow,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: new Error(body.error ?? res.statusText) };
    }
    return { data: body.data ?? null, error: null, count: body.count ?? null };
  }

  async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
    this.limitN = 1;
    const { data, error } = await this.run();
    if (error) return { data: null, error };
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return { data: (rows[0] as T) ?? null, error: null };
  }

  async single(): Promise<{ data: T | null; error: Error | null }> {
    const res = await this.maybeSingle();
    if (res.error) return res;
    if (!res.data) return { data: null, error: new Error("Row not found") };
    return res;
  }

  then<
    TResult1 = { data: T[] | null; error: Error | null; count?: number | null },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((value: {
          data: T[] | null;
          error: Error | null;
          count?: number | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.run().then((r) => {
      if (r.count != null) {
        const out = { data: null, error: r.error, count: r.count };
        return onfulfilled ? onfulfilled(out) : (out as unknown as TResult1);
      }
      const out = {
        data: Array.isArray(r.data) ? r.data : r.data ? [r.data as T] : null,
        error: r.error,
      };
      return onfulfilled ? onfulfilled(out) : (out as unknown as TResult1);
    }, onrejected);
  }
}

export function apiFrom(table: string): ApiQueryBuilder {
  return new ApiQueryBuilder(table);
}
