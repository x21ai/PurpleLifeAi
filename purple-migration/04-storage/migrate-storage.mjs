#!/usr/bin/env node
// Stream every object in storage-manifest.json into the NEW project.
//
// Env:
//   NEW_SUPABASE_URL                 (required)
//   NEW_SUPABASE_SERVICE_ROLE_KEY    (required)

import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
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

for (const b of manifest.buckets) {
  const { error } = await admin.storage.createBucket(b, { public: false });
  if (error && !String(error.message).toLowerCase().includes("exists")) {
    console.warn(`bucket ${b}: ${error.message}`);
  }
}

const errors = [];
let uploaded = 0;
let i = 0;
for (const obj of manifest.manifest) {
  i += 1;
  try {
    const res = await fetch(obj.signedUrl);
    if (!res.ok) throw new Error(`GET ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await admin.storage
      .from(obj.bucket)
      .upload(obj.path, buf, {
        upsert: true,
        contentType: obj.contentType ?? undefined,
      });
    if (error) throw error;
    uploaded += 1;
    if (i % 25 === 0) console.log(`${i}/${manifest.count}...`);
  } catch (e) {
    errors.push({ bucket: obj.bucket, path: obj.path, error: String(e?.message ?? e) });
  }
}

await writeFile(join(here, "migrate-storage.errors.json"), JSON.stringify(errors, null, 2));
console.log(`uploaded=${uploaded}/${manifest.count} errors=${errors.length}`);
process.exit(errors.length ? 2 : 0);