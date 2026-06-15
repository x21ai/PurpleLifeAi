#!/usr/bin/env node
// Compare NEW storage objects vs storage-manifest.json.

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const URL = process.env.NEW_SUPABASE_URL;
const KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Set NEW_SUPABASE_URL and NEW_SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const manifest = JSON.parse(
  await readFile(join(here, "storage-manifest.json"), "utf8"),
);

async function listAll(bucket, prefix = "") {
  const out = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit, offset });
    if (error) throw error;
    if (!data?.length) break;
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id == null) out.push(...(await listAll(bucket, full)));
      else out.push(full);
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

let mismatch = 0;
for (const bucket of manifest.buckets) {
  const expected = new Set(
    manifest.manifest.filter((m) => m.bucket === bucket).map((m) => m.path),
  );
  const actual = new Set(await listAll(bucket));
  const missing = [...expected].filter((p) => !actual.has(p));
  const extra = [...actual].filter((p) => !expected.has(p));
  console.log(
    `${bucket}: expected=${expected.size} actual=${actual.size} missing=${missing.length} extra=${extra.length}`,
  );
  if (missing.length) {
    console.log("  missing:", missing.slice(0, 10));
    mismatch += 1;
  }
}
process.exit(mismatch ? 2 : 0);