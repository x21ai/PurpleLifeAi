#!/usr/bin/env node
/**
 * Live-data guard.
 *
 * Scans the codebase for hard-coded test/placeholder/mock/fixture data and
 * queries the database for rows that look like seeded test fixtures. Exits
 * with code 1 if anything non-live is found.
 *
 * Usage:
 *   node scripts/check-no-test-data.mjs            # code scan only
 *   node scripts/check-no-test-data.mjs --db       # code + database scan
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "app"];
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".lovable",
  ".workspace",
  ".agents",
  ".claude",
  "supabase/seeds",
  "scripts",
  "tests",
  "e2e",
  "playwright-report",
  "test-results",
]);
const IGNORE_FILES = new Set(["src/integrations/supabase/types.ts", "src/routeTree.gen.ts"]);
const ALLOW_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

// Patterns that signal non-live data. Each: { id, re, why }
const PATTERNS = [
  { id: "lorem", re: /\blorem\s+ipsum\b/i, why: "Lorem ipsum placeholder copy" },
  {
    id: "mock-const",
    re: /\b(?:const|let|var)\s+(?:mock|fake|dummy|stub|sample|fixture)[A-Z_]/,
    why: "Variable named mock/fake/dummy/sample/fixture",
  },
  {
    id: "mock-array",
    re: /\b(?:MOCK|FAKE|DUMMY|SAMPLE|FIXTURE)_[A-Z_]+\s*=/,
    why: "Uppercase MOCK_/FAKE_/SAMPLE_ constant",
  },
  { id: "example-email", re: /[\w.+-]+@example\.(?:com|org|net)\b/i, why: "@example.com address" },
  {
    id: "test-email",
    re: /\b(?:test|fake|dummy)@[\w.-]+\.[a-z]{2,}/i,
    why: "test@/fake@/dummy@ email",
  },
  { id: "john-doe", re: /\bjohn\s+doe\b|\bjane\s+doe\b/i, why: "John/Jane Doe placeholder" },
  {
    id: "foo-bar",
    re: /["'`](?:foo|bar|baz|qux)\s+(?:foo|bar|baz|qux)["'`]/i,
    why: "foo/bar/baz placeholder string",
  },
  {
    id: "todo-fake",
    re: /\/\/\s*(?:TODO|FIXME|HACK)[^\n]*(?:mock|fake|hardcod|placeholder|stub)/i,
    why: "TODO/FIXME referencing mock/hardcoded data",
  },
  { id: "hardcoded", re: /\bhard-?coded?\b/i, why: "Comment/string mentions hard-coded" },
  {
    id: "placeholder-comp",
    re: /PlaceholderIndex|data-lovable-blank-page-placeholder|REPLACE this/,
    why: "Lovable placeholder boilerplate",
  },
  {
    id: "test-uuid",
    re: /\b00000000-0000-0000-0000-0000000000(?:0[1-9]|[1-9]\d)\b/,
    why: "Sentinel test UUID",
  },
  {
    id: "lipsum-url",
    re: /loremipsum|placehold(?:er)?\.(?:co|com|it)|via\.placeholder/i,
    why: "Placeholder image/text service URL",
  },
];

// Lines containing any of these substrings are excluded from matching.
const LINE_ALLOWLIST = ["eslint-disable", "live-data-guard:allow"];

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
    if (IGNORE_DIRS.has(name) || IGNORE_DIRS.has(rel)) continue;
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (ALLOW_EXT.has(extname(name)) && !IGNORE_FILES.has(rel)) out.push(full);
  }
  return out;
}

function scanFile(path) {
  const rel = relative(ROOT, path);
  if (/\.(test|spec)\.[tj]sx?$/.test(rel)) return [];
  const lines = readFileSync(path, "utf8").split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (LINE_ALLOWLIST.some((s) => line.includes(s))) continue;
    for (const p of PATTERNS) {
      if (p.re.test(line))
        hits.push({
          file: rel,
          line: i + 1,
          id: p.id,
          why: p.why,
          text: line.trim().slice(0, 200),
        });
    }
  }
  return hits;
}

function scanCode() {
  const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
  return files.flatMap(scanFile);
}

async function scanDatabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEYS;
  if (!url || !key) {
    console.warn("[db] Skipping DB scan: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.");
    return [];
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const queries = [
    {
      name: "profiles.example-emails",
      url: `${url}/rest/v1/profiles?select=id,first_name,last_name&or=(first_name.ilike.test%25,first_name.ilike.john%20doe,last_name.ilike.doe)`,
    },
    {
      name: "journal_entries.lorem",
      url: `${url}/rest/v1/journal_entries?select=id,text&text=ilike.%25lorem%20ipsum%25&limit=5`,
    },
    {
      name: "medications.placeholder-names",
      url: `${url}/rest/v1/medications?select=id,name&or=(name.ilike.test%25,name.ilike.example%25,name.ilike.placeholder%25,name.ilike.sample%25)&limit=5`,
    },
    {
      name: "trips.sample-labels",
      url: `${url}/rest/v1/trips?select=id,label&or=(label.ilike.test%25,label.ilike.sample%25,label.ilike.example%25)&limit=5`,
    },
  ];
  const hits = [];
  for (const q of queries) {
    try {
      const r = await fetch(q.url, { headers });
      if (!r.ok) {
        console.warn(`[db] ${q.name} -> HTTP ${r.status}`);
        continue;
      }
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length) {
        hits.push({ check: q.name, count: rows.length, sample: rows.slice(0, 3) });
      }
    } catch (e) {
      console.warn(`[db] ${q.name} failed:`, e?.message || e);
    }
  }
  return hits;
}

const wantDb = process.argv.includes("--db");
const codeHits = scanCode();
const dbHits = wantDb ? await scanDatabase() : [];

if (codeHits.length === 0 && dbHits.length === 0) {
  console.log(
    `OK: no hard-coded test/placeholder data found in ${SCAN_DIRS.join(", ")}${wantDb ? " or database" : ""}.`,
  );
  process.exit(0);
}

if (codeHits.length) {
  console.error(`\nFOUND ${codeHits.length} suspicious code line(s):\n`);
  for (const h of codeHits) {
    console.error(`  ${h.file}:${h.line}  [${h.id}] ${h.why}`);
    console.error(`    > ${h.text}`);
  }
  console.error(`\nIf a match is intentional, append "// live-data-guard:allow" to that line.`);
}
if (dbHits.length) {
  console.error(`\nFOUND ${dbHits.length} suspicious database result(s):\n`);
  for (const h of dbHits) {
    console.error(`  ${h.check}: ${h.count} row(s)`);
    console.error(`    sample: ${JSON.stringify(h.sample)}`);
  }
}
process.exit(1);
