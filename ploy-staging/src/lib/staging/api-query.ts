import { authHeaders } from "./session";

type Filter =
  | { op: "eq"; col: string; val: unknown }
  | { op: "gte"; col: string; val: unknown }
  | { op: "lte"; col: string; val: unknown }
  | { op: "in"; col: string; val: unknown[] };

export class StagingApiQuery<T = Record<string, unknown>> {
  private filters: Filter[] = [];
  private orderBy: { col: string; ascending: boolean }[] = [];
  private limitN: number | null = null;
  private selectCols = "*";

  constructor(private table: string) {}

  select(cols: string): this {
    this.selectCols = cols.trim();
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

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  private async run(): Promise<{ data: T[] | T | null; error: Error | null }> {
    const res = await fetch("/api/data/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        table: this.table,
        mode: "select",
        select: this.selectCols,
        filters: this.filters,
        order: this.orderBy,
        limit: this.limitN,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { data?: T[] | T; error?: string };
    if (!res.ok) {
      return { data: null, error: new Error(body.error ?? res.statusText) };
    }
    return { data: body.data ?? null, error: null };
  }

  async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
    this.limitN = 1;
    const { data, error } = await this.run();
    if (error) return { data: null, error };
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return { data: (rows[0] as T) ?? null, error: null };
  }

  async list(): Promise<{ data: T[]; error: Error | null }> {
    const { data, error } = await this.run();
    if (error) return { data: [], error };
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return { data: rows as T[], error: null };
  }
}

export function stagingFrom(table: string): StagingApiQuery {
  return new StagingApiQuery(table);
}
