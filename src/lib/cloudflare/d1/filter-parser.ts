/**
 * Parses Supabase PostgREST-style filter strings for D1 query builders.
 * Examples: `is_broadcast.eq.true`, `recipient_id.eq.uuid`, `expires_at.is.null`
 */

export type ParsedOrClause =
  | { op: "eq"; col: string; val: unknown }
  | { op: "gte"; col: string; val: unknown }
  | { op: "lte"; col: string; val: unknown }
  | { op: "gt"; col: string; val: unknown }
  | { op: "lt"; col: string; val: unknown }
  | { op: "is"; col: string; val: null };

export type OrFilterGroup = { op: "or"; clauses: ParsedOrClause[] };

function parseScalar(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null") return null;
  const n = Number(raw);
  if (raw !== "" && !Number.isNaN(n) && String(n) === raw) return n;
  return raw;
}

/** Split `col.op.val,col2.op2.val2` into clause triples. */
export function parseOrFilter(filter: string): ParsedOrClause[] {
  const clauses: ParsedOrClause[] = [];
  for (const part of filter.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const dot = trimmed.indexOf(".");
    if (dot < 0) continue;
    const col = trimmed.slice(0, dot);
    const rest = trimmed.slice(dot + 1);
    const opDot = rest.indexOf(".");
    if (opDot < 0) continue;
    const op = rest.slice(0, opDot);
    const valRaw = rest.slice(opDot + 1);
    if (op === "is" && valRaw === "null") {
      clauses.push({ op: "is", col, val: null });
      continue;
    }
    const val = parseScalar(valRaw);
    if (op === "eq") clauses.push({ op: "eq", col, val });
    else if (op === "gte") clauses.push({ op: "gte", col, val });
    else if (op === "lte") clauses.push({ op: "lte", col, val });
    else if (op === "gt") clauses.push({ op: "gt", col, val });
    else if (op === "lt") clauses.push({ op: "lt", col, val });
  }
  return clauses;
}

export function serializeBool(val: unknown): unknown {
  if (val === true) return 1;
  if (val === false) return 0;
  return val;
}
