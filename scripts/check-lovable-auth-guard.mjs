#!/usr/bin/env node
/**
 * Build-time check: every use of the Lovable auth client must be host-guarded.
 *
 * The @lovable.dev/cloud-auth-js client (exposed as `lovable.auth` via
 * src/integrations/lovable/) only works on Lovable preview hosts. On
 * www.purplelife.org it silently fails, so every file that imports it or
 * calls `lovable.auth` must also branch on isLovablePreviewHost() from
 * src/lib/lovable-preview.ts. This script fails CI when a usage site is
 * missing that guard (the root cause of the OAuth production incident,
 * see docs/SYNC-AND-RELEASE.md case study 3).
 *
 * Usage: node scripts/check-lovable-auth-guard.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const SRC_DIR = "src";
// The wrapper module itself legitimately references the client unguarded.
const EXCLUDED_DIR = join("src", "integrations", "lovable") + sep;

const USAGE_PATTERNS = [
  /\blovable\.auth\b/,
  /from\s+["']@\/integrations\/lovable["']/,
  /from\s+["']@lovable\.dev\/cloud-auth-js["']/,
];
const GUARD = "isLovablePreviewHost";

function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const offenders = [];
for (const file of listSourceFiles(SRC_DIR)) {
  if (file.startsWith(EXCLUDED_DIR)) continue;
  const text = readFileSync(file, "utf8");
  const usesLovableAuth = USAGE_PATTERNS.some((re) => re.test(text));
  if (usesLovableAuth && !text.includes(GUARD)) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error("\n✗ Unguarded lovable.auth usage (breaks OAuth outside Lovable preview):\n");
  for (const f of offenders) {
    console.error(`  ${f}`);
  }
  console.error(
    "\nEvery file that imports @/integrations/lovable or calls lovable.auth must",
  );
  console.error(
    "branch on isLovablePreviewHost() (src/lib/lovable-preview.ts) and fall back",
  );
  console.error("to supabase.auth on all other hosts.\n");
  process.exit(1);
}

console.log("check-lovable-auth-guard: ok, all lovable.auth usage is host-guarded.");
