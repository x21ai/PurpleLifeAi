#!/usr/bin/env node
/**
 * Copy storage objects from a Supabase export manifest into R2 (purplelifeai bucket).
 * Manifest format matches purple-migration storage export (signedUrl per object).
 *
 * Usage:
 *   node scripts/cloudflare/import-r2-from-manifest.mjs path/to/storage-manifest.json [--remote]
 *
 * Requires: wrangler r2 object put access (or use Worker admin route in staging).
 * No Supabase credentials in repo: manifest must contain pre-signed GET URLs.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const manifestPath = args.find((a) => !a.startsWith("--"));
const remote = args.includes("--remote");

if (!manifestPath) {
  console.error("Usage: node import-r2-from-manifest.mjs <manifest.json> [--remote]");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const objects = manifest.manifest ?? manifest;
let uploaded = 0;
const errors = [];

for (const obj of objects) {
  const { bucket, path, signedUrl, contentType } = obj;
  if (!signedUrl || !bucket || !path) continue;
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) throw new Error(`GET ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const key = `${bucket}/${path}`;
    const tmp = `/tmp/r2-import-${Date.now()}`;
    const { writeFileSync, unlinkSync } = await import("node:fs");
    writeFileSync(tmp, buf);
    const wrArgs = [
      "r2", "object", "put", `purplelifeai/${key}`, "--file", tmp,
      "--content-type", contentType ?? "application/octet-stream",
    ];
    if (remote) wrArgs.push("--remote");
    const put = spawnSync("bunx", ["wrangler", ...wrArgs], { stdio: "pipe" });
    unlinkSync(tmp);
    if (put.status !== 0) {
      throw new Error(put.stderr?.toString() ?? "wrangler put failed");
    }
    uploaded += 1;
    if (uploaded % 25 === 0) console.log(`uploaded ${uploaded}...`);
  } catch (e) {
    errors.push({ bucket, path, error: String(e?.message ?? e) });
  }
}

console.log(`uploaded=${uploaded} errors=${errors.length}`);
if (errors.length) {
  console.error(JSON.stringify(errors.slice(0, 10), null, 2));
  process.exit(2);
}
