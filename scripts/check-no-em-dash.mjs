#!/usr/bin/env node
/**
 * Em-dash guard. Fails the build if any em dash (U+2014, "—") sneaks back
 * into src/ or public/. Project rule: never use em dashes; use ",", "and",
 * "or", ":", or split the sentence instead.
 *
 * Usage: node scripts/check-no-em-dash.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "public"];
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".lovable", ".workspace"]);
const IGNORE_FILES = new Set(["src/integrations/supabase/types.ts", "src/routeTree.gen.ts"]);
const EM = "\u2014";

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(ROOT, p);
    if (IGNORE_DIRS.has(name) || IGNORE_FILES.has(rel)) continue;
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p);
      continue;
    }
    let text;
    try {
      text = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    if (!text.includes(EM)) continue;
    text.split("\n").forEach((line, i) => {
      if (line.includes(EM)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
}
for (const d of SCAN_DIRS) {
  try {
    walk(join(ROOT, d));
  } catch {}
}
if (hits.length) {
  console.error("Em dash (—) found. Use ',' / 'and' / 'or' / ':' instead:\n");
  for (const h of hits) console.error("  " + h);
  process.exit(1);
}
console.log("No em dashes. ✓");
