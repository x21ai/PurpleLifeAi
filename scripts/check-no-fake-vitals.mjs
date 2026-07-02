#!/usr/bin/env node
/**
 * Fails when app health screens contain invented vitals or misleading empty
 * fallbacks (sample scores, demo metrics, fake qualitative statuses).
 *
 * Reference catalogs, email previews, and form placeholders are allowlisted.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = [
  "src/routes/_app",
  "src/components/today",
  "src/components/common",
];
const SCAN_FILES = ["src/lib/health-scores.functions.ts"];
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build"]);
const ALLOW_EXT = new Set([".ts", ".tsx"]);

const FILE_ALLOWLIST = new Set([
  "src/lib/condition-catalog.ts",
  "src/lib/med-dictionary.ts",
  "src/lib/dna-curated-rsids.ts",
]);

const PATTERNS = [
  { id: "demo-steps-5511", re: /\b5511\b|5,511/, why: "Hardcoded sample step count" },
  { id: "demo-steps-5840", re: /\b5840\b|5,840/, why: "Hardcoded sample step count" },
  { id: "typical-sleep", re: /Typical sleep score/i, why: "Invented sleep score copy" },
  { id: "cardio-age", re: /Cardiovascular Age/i, why: "Invented cardiovascular age copy" },
  { id: "cumulative-stress", re: /Cumulative Stress/i, why: "Invented stress summary" },
  { id: "bedtime-varies", re: /Bedtime varies/i, why: "Invented sleep regularity copy" },
  { id: "demo-badge", re: /\bDemoBadge\b/, why: "Demo badge on health metrics" },
  { id: "demo-notice", re: /\bDemoNotice\b/, why: "Demo notice on health metrics" },
  { id: "demo-data-label", re: /Demo data/, why: "Demo data label on health screens" },
  { id: "symptom-no-signs", re: /status=["']No signs["']/, why: "Fake Symptom Radar status" },
  { id: "body-clock-aligned", re: /status=["']Aligned["']/, why: "Fake Body Clock status" },
  { id: "sample-overview", re: /sample overview/i, why: "Sample overview narrative copy" },
];

const LINE_ALLOWLIST = ["fake-vitals-guard:allow"];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const rel = relative(ROOT, full);
    if (IGNORE_DIRS.has(name)) continue;
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (ALLOW_EXT.has(name) && !FILE_ALLOWLIST.has(rel)) out.push(full);
  }
  return out;
}

function scanFile(path) {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, "utf8").split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (LINE_ALLOWLIST.some((s) => line.includes(s))) continue;
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        hits.push({
          file: rel,
          line: i + 1,
          id: p.id,
          why: p.why,
          text: line.trim().slice(0, 200),
        });
      }
    }
  }
  return hits;
}

const files = [
  ...SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))),
  ...SCAN_FILES.map((f) => join(ROOT, f)).filter((f) => {
    try {
      statSync(f);
      return true;
    } catch {
      return false;
    }
  }),
];

const hits = files.flatMap(scanFile);

if (hits.length === 0) {
  console.log("OK: no invented health vitals or misleading demo fallbacks found.");
  process.exit(0);
}

console.error(`\nFOUND ${hits.length} invented vitals / demo fallback line(s):\n`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}  [${h.id}] ${h.why}`);
  console.error(`    > ${h.text}`);
}
console.error('\nIf a match is intentional, append "// fake-vitals-guard:allow" to that line.');
process.exit(1);
