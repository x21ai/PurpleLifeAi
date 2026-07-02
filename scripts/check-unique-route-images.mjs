#!/usr/bin/env node
/**
 * Build-time check: no two marketing routes may reference the same hero/moment image.
 *
 * Marketing routes import named groups (homeImages, featuresImages, …) from
 * per-page modules under src/lib/calm-images/. Each group resolves to a set of
 * physical files under src/assets/. If two groups point at the same file, this
 * script fails so the regression is caught before it ships.
 *
 * Skips in-app routes under src/routes/_app/* — those have their own visual
 * vocabulary and may legitimately share assets.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const CALM_IMAGES_DIR = "src/lib/calm-images";
const ROUTES_DIR = "src/routes";

function parseCalmImages() {
  // Map of exported group name -> Set<asset filename>, aggregated across every
  // per-page module in the calm-images directory.
  const groups = new Map();
  for (const file of readdirSync(CALM_IMAGES_DIR)) {
    if (!file.endsWith(".ts") || file.startsWith("_")) continue;
    const src = readFileSync(join(CALM_IMAGES_DIR, file), "utf8");
    // Map of local import name -> asset filename (basename, no query string)
    const importMap = new Map();
    const importRe = /import\s+(\w+)\s+from\s+["']@\/assets\/([^"'?]+)(?:\?[^"']*)?["']/g;
    for (const m of src.matchAll(importRe)) {
      importMap.set(m[1], m[2]);
    }
    const groupRe = /export const (\w+)\s*=\s*\{([\s\S]*?)\}\s*as const;/g;
    for (const m of src.matchAll(groupRe)) {
      const [, name, body] = m;
      const assets = new Set();
      // Match identifiers used as args (asset(localName, ...)) or bare `: localName`
      const refRe = /\b([A-Za-z_][\w]*)\b/g;
      for (const r of body.matchAll(refRe)) {
        const ident = r[1];
        if (importMap.has(ident)) assets.add(importMap.get(ident));
      }
      groups.set(name, assets);
    }
  }
  return groups;
}

function listRouteFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (entry === "_app") continue;
        walk(full);
      } else if (entry.endsWith(".tsx")) {
        out.push(full);
      }
    }
  };
  walk(ROUTES_DIR);
  return out;
}

function groupsUsedBy(file) {
  const src = readFileSync(file, "utf8");
  // Match imports from any per-page module, e.g. "@/lib/calm-images/home".
  const importRe = /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/calm-images\/[\w-]+["']/g;
  const names = [];
  for (const m of src.matchAll(importRe)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.push(name);
    }
  }
  return names;
}

const groups = parseCalmImages();
const routes = listRouteFiles();

// asset filename -> Set<route file>
const assetUsage = new Map();
for (const route of routes) {
  const used = groupsUsedBy(route);
  for (const g of used) {
    const assets = groups.get(g);
    if (!assets) continue;
    for (const a of assets) {
      if (!assetUsage.has(a)) assetUsage.set(a, new Set());
      assetUsage.get(a).add(route);
    }
  }
}

const dupes = [];
for (const [asset, routesUsing] of assetUsage) {
  if (routesUsing.size > 1) dupes.push({ asset, routes: [...routesUsing] });
}

if (dupes.length > 0) {
  console.error("\n✗ Marketing routes share hero/moment assets:\n");
  for (const d of dupes) {
    console.error(`  ${basename(d.asset)}`);
    for (const r of d.routes) console.error(`    used by ${r}`);
    console.error("");
  }
  console.error("Each marketing route must have its own unique imagery.");
  console.error("Generate a new asset for the duplicated slot instead of reusing one.\n");
  process.exit(1);
}

console.log(`✓ All ${assetUsage.size} marketing assets are used by exactly one route.`);
// Reject Lovable CDN pointers: they 404 outside Lovable preview.
const calmDir = CALM_IMAGES_DIR;
let lovableBad = false;
for (const file of readdirSync(calmDir)) {
  if (!file.endsWith(".ts") || file.startsWith("_")) continue;
  const src = readFileSync(join(calmDir, file), "utf8");
  if (src.includes("__l5e") || src.includes(".asset.json")) {
    console.error(`✗ ${join(calmDir, file)} references Lovable CDN assets (__l5e or .asset.json). Use local src/assets/*.jpg with vite imagetools instead.`);
    lovableBad = true;
  }
  const importRe = /import\s+\w+\s+from\s+["']@\/assets\/([^"'?]+)(?:\?[^"']*)?["']/g;
  for (const m of src.matchAll(importRe)) {
    const assetPath = join("src/assets", m[1]);
    if (!existsSync(assetPath)) {
      console.error(`✗ Missing marketing asset file: ${assetPath} (imported from ${file})`);
      lovableBad = true;
    }
  }
}
if (lovableBad) process.exit(1);
