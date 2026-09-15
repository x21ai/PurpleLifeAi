import { d1All, d1First, d1Run } from "../d1/client";

type Filter =
  | { op: "eq"; col: string; val: unknown }
  | { op: "gte"; col: string; val: unknown }
  | { op: "lte"; col: string; val: unknown }
  | { op: "in"; col: string; val: unknown[] }
  | { op: "is"; col: string; val: null };

type Order = { col: string; ascending: boolean };

export class D1QueryBuilder<T = Record<string, unknown>> {
  private filters: Filter[] = [];
  private orderBy: Order[] = [];
  private limitN: number | null = null;
  private selectCols = "*";
  private insertRow: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateRow: Record<string, unknown> | null = null;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private userScopeCol: string | null = null;
  private userScopeVal: string | null = null;

  constructor(
    private table: string,
    userId?: string,
  ) {
    if (userId) {
      this.userScopeCol = "user_id";
      this.userScopeVal = userId;
    }
  }

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

  in(col: string, val: unknown[]): this {
    this.filters.push({ op: "in", col, val });
    return this;
  }

  is(col: string, val: null): this {
    this.filters.push({ op: "is", col, val });
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

  private buildWhere(params: unknown[]): string {
    const clauses: string[] = [];
    if (this.userScopeCol && this.userScopeVal) {
      clauses.push(`${this.userScopeCol} = ?`);
      params.push(this.userScopeVal);
    }
    for (const f of this.filters) {
      if (f.op === "eq") {
        clauses.push(`${f.col} = ?`);
        params.push(f.val);
      } else if (f.op === "gte") {
        clauses.push(`${f.col} >= ?`);
        params.push(f.val);
      } else if (f.op === "lte") {
        clauses.push(`${f.col} <= ?`);
        params.push(f.val);
      } else if (f.op === "in") {
        const arr = f.val as unknown[];
        if (arr.length === 0) {
          clauses.push("1 = 0");
        } else {
          clauses.push(`${f.col} IN (${arr.map(() => "?").join(", ")})`);
          params.push(...arr);
        }
      } else if (f.op === "is") {
        clauses.push(`${f.col} IS NULL`);
      }
    }
    return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  }

  private serializeValue(v: unknown): unknown {
    if (v === undefined) return null;
    if (typeof v === "object" && v !== null && !(v instanceof Date)) {
      return JSON.stringify(v);
    }
    return v;
  }

  async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
    this.limitN = 1;
    const { data, error } = await this.executeSelect();
    if (error) return { data: null, error };
    const row = (data ?? [])[0] ?? null;
    return { data: row as T | null, error: null };
  }

  async single(): Promise<{ data: T | null; error: Error | null }> {
    const res = await this.maybeSingle();
    if (res.error) return res;
    if (!res.data) return { data: null, error: new Error("Row not found") };
    return res;
  }

  then<TResult1 = { data: T[] | null; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      if (this.mode === "insert") return this.executeInsert();
      if (this.mode === "update") return this.executeUpdate();
      if (this.mode === "delete") return this.executeDelete();
      return this.executeSelect();
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  private parseSelectColumns(): { base: string[]; embeds: Array<{ alias: string; table: string; cols: string }> } {
    const parts = this.selectCols.split(",").map((s) => s.trim());
    const base: string[] = [];
    const embeds: Array<{ alias: string; table: string; cols: string }> = [];
    for (const p of parts) {
      const m = p.match(/^(\w+):(\w+)\(([^)]+)\)$/);
      if (m) {
        embeds.push({ alias: m[1], table: m[2], cols: m[3] });
      } else if (p !== "*") {
        base.push(p);
      }
    }
    return { base, embeds };
  }

  private async executeSelect(): Promise<{ data: T[] | null; error: Error | null }> {
    const params: unknown[] = [];
    const where = this.buildWhere(params);
    const { base, embeds } = this.parseSelectColumns();
    const cols =
      base.length > 0 || embeds.length > 0
        ? [...base, ...embeds.map((e) => `${this.table}.${e.alias}_fk`)].filter(Boolean).join(", ") || "*"
        : "*";

    // Simple select without embeds first
    if (embeds.length === 0) {
      const selectList = this.selectCols === "*" ? "*" : base.join(", ") || "*";
      let sql = `SELECT ${selectList} FROM ${this.table} ${where}`;
      if (this.orderBy.length) {
        sql += ` ORDER BY ${this.orderBy.map((o) => `${o.col} ${o.ascending ? "ASC" : "DESC"}`).join(", ")}`;
      }
      if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
      const rows = await d1All<Record<string, unknown>>(sql, ...params);
      return { data: rows.map(parseRow) as T[], error: null };
    }

    // Handle medication:medications(...) embed for meds-today
    let sql = `SELECT ${this.table}.* FROM ${this.table} ${where}`;
    if (this.orderBy.length) {
      sql += ` ORDER BY ${this.orderBy.map((o) => `${o.col} ${o.ascending ? "ASC" : "DESC"}`).join(", ")}`;
    }
    if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
    const rows = await d1All<Record<string, unknown>>(sql, ...params);

    const out: Record<string, unknown>[] = [];
    for (const row of rows) {
      const parsed = parseRow(row);
      for (const emb of embeds) {
        const medId = parsed.medication_id as string | undefined;
        if (medId && emb.table === "medications") {
          const med = await d1First<Record<string, unknown>>(
            `SELECT ${emb.cols} FROM medications WHERE id = ?`,
            medId,
          );
          parsed[emb.alias] = med ? parseRow(med) : null;
        } else if (medId) {
          const rel = await d1First<Record<string, unknown>>(
            `SELECT ${emb.cols} FROM ${emb.table} WHERE id = ?`,
            medId,
          );
          parsed[emb.alias] = rel ? parseRow(rel) : null;
        } else {
          parsed[emb.alias] = null;
        }
      }
      out.push(parsed);
    }
    return { data: out as T[], error: null };
  }

  private async executeInsert(): Promise<{ data: T[] | null; error: Error | null }> {
    const rows = Array.isArray(this.insertRow) ? this.insertRow : [this.insertRow!];
    const inserted: T[] = [];
    for (const row of rows) {
      const id = (row.id as string | undefined) ?? crypto.randomUUID();
      const full: Record<string, unknown> = { ...row, id };
      if (this.userScopeVal && !full.user_id) full.user_id = this.userScopeVal;
      const cols = Object.keys(full);
      const vals = cols.map((c) => this.serializeValue(full[c]));
      await d1Run(
        `INSERT INTO ${this.table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        ...vals,
      );
      inserted.push(parseRow(full) as T);
    }
    return { data: inserted, error: null };
  }

  private async executeUpdate(): Promise<{ data: T[] | null; error: Error | null }> {
    if (!this.updateRow) return { data: null, error: new Error("No update row") };
    const cols = Object.keys(this.updateRow);
    const params: unknown[] = cols.map((c) => this.serializeValue(this.updateRow![c]));
    const set = cols.map((c) => `${c} = ?`).join(", ");
    const where = this.buildWhere(params);
    await d1Run(`UPDATE ${this.table} SET ${set} ${where}`, ...params);
    return { data: null, error: null };
  }

  private async executeDelete(): Promise<{ data: T[] | null; error: Error | null }> {
    const params: unknown[] = [];
    const where = this.buildWhere(params);
    await d1Run(`DELETE FROM ${this.table} ${where}`, ...params);
    return { data: null, error: null };
  }
}

function parseRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string" && (v.startsWith("[") || v.startsWith("{"))) {
      try {
        out[k] = JSON.parse(v);
      } catch {
        // keep string
      }
    }
    if (typeof v === "string" && v === "true") out[k] = true;
    if (typeof v === "string" && v === "false") out[k] = false;
  }
  return out;
}

export function d1From(table: string, userId?: string): D1QueryBuilder {
  return new D1QueryBuilder(table, userId);
}
