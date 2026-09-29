/** D1/SQLite bind cap is low (~100). Keep IN batches small for headroom with user_id + other filters. */
export const D1_MAX_IN_BINDINGS = 48;

export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
