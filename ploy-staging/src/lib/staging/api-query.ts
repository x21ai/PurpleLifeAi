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
  private mode: "select" | "insert" | "update" = "select";
  private insertRow: Record<string, unknown> | null = null;
  private updateRow: Record<string, unknown> | null = null;

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

  insert(row: Record<string, unknown>): this {
    this.mode = "insert";
    this.insertRow = row;
    return this;
  }

  update(row: Record<string, unknown>): this {
    this.mode = "update";
    this.updateRow = row;
    return this;
  }

  private async run(): Promise<{ data: T[] | T | null; error: Error | null }> {
    const payload: Record<string, unknown> = {
      table: this.table,
      mode: this.mode,
      select: this.selectCols,
      filters: this.filters,
      order: this.orderBy,
      limit: this.limitN,
    };
    if (this.mode === "insert" && this.insertRow) payload.insert = this.insertRow;
    if (this.mode === "update" && this.updateRow) payload.update = this.updateRow;

    const res = await fetch("/api/data/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: T[] | T; error?: string };
    if (!res.ok) {
      return { data: null, error: new Error(json.error ?? res.statusText) };
    }
    return { data: json.data ?? null, error: null };
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
