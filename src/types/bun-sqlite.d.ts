/** Ambient module so tsc can compile the in-memory auth helper. Bun supplies the runtime. */
declare module "bun:sqlite" {
  interface Statement {
    get(...args: never[]): unknown;
    all(...args: never[]): unknown[];
    run(...args: never[]): { changes: number };
  }

  export class Database {
    constructor(filename?: string);
    exec(sql: string): void;
    query(sql: string): Statement;
  }
}
