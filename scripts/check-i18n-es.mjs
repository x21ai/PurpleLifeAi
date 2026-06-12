#!/usr/bin/env node
/**
 * Spanish i18n completeness guard.
 *
 * 1. Every key in en.json must exist in es.json (locale parity).
 * 2. Every static t("…") / t('…') key used under src/ must resolve in es.json,
 *    including i18next plural forms (_one, _other, …) and simple dynamic
 *    prefixes such as t(`timeline.${r}`) expanded from nearby literal arrays.
 *
 * Usage: node scripts/check-i18n-es.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EN_PATH = join(ROOT, "src/i18n/locales/en.json");
const ES_PATH = join(ROOT, "src/i18n/locales/es.json");
const SCAN_DIR = join(ROOT, "src");
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".lovable", ".workspace"]);
const IGNORE_FILES = new Set(["src/integrations/supabase/types.ts", "src/routeTree.gen.ts"]);
const ALLOW_EXT = new Set([".ts", ".tsx"]);
const PLURAL_SUFFIXES = ["_zero", "_one", "_two", "_few", "_many", "_other"];
const STATIC_KEY = /\bt\(\s*["']([a-zA-Z][a-zA-Z0-9_.]*)["']/g;
const DYNAMIC_KEY = /\bt\(\s*`([a-zA-Z][a-zA-Z0-9_.]*)\$\{[^}]+\}`/g;
const ARRAY_LITERAL = /\[([^\]]+)\]\s*as\s+const\)\.map\(\(\s*(\w+)/g;

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(ROOT, p);
    if (IGNORE_DIRS.has(name) || IGNORE_FILES.has(rel)) continue;
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p, out);
      continue;
    }
    if (!ALLOW_EXT.has(p.slice(p.lastIndexOf(".")))) continue;
    out.push(p);
  }
  return out;
}

function parseStringLiterals(raw) {
  const values = [];
  const re = /["']([a-zA-Z][a-zA-Z0-9_]*)["']/g;
  let m;
  while ((m = re.exec(raw)) !== null) values.push(m[1]);
  return values;
}

function resolveKey(key, localeKeys) {
  if (key in localeKeys) return true;
  return PLURAL_SUFFIXES.some((suffix) => `${key}${suffix}` in localeKeys);
}

function collectUsedKeys(files, localeKeys) {
  const used = new Map();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const rel = relative(ROOT, file);

    for (const re of [STATIC_KEY]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const key = m[1];
        if (!used.has(key)) used.set(key, new Set());
        used.get(key).add(rel);
      }
    }

    DYNAMIC_KEY.lastIndex = 0;
    let dm;
    while ((dm = DYNAMIC_KEY.exec(text)) !== null) {
      const prefix = dm[1];
      const windowStart = Math.max(0, dm.index - 1200);
      const window = text.slice(windowStart, dm.index + dm[0].length);
      ARRAY_LITERAL.lastIndex = 0;
      let am;
      const suffixes = new Set();
      while ((am = ARRAY_LITERAL.exec(window)) !== null) {
        for (const lit of parseStringLiterals(am[1])) suffixes.add(lit);
      }
      if (suffixes.size === 0) {
        const escaped = prefix.replace(/\./g, "\\.");
        const re = new RegExp(`^${escaped}([^.]+)$`);
        for (const k of Object.keys(localeKeys)) {
          const m = k.match(re);
          if (m) suffixes.add(m[1]);
        }
      }
      if (suffixes.size === 0) {
        if (!used.has(`\`${prefix}\${…}\``)) used.set(`\`${prefix}\${…}\``, new Set());
        used.get(`\`${prefix}\${…}\``).add(rel);
        continue;
      }
      for (const suffix of suffixes) {
        const key = `${prefix}${suffix}`;
        if (!used.has(key)) used.set(key, new Set());
        used.get(key).add(rel);
      }
    }
  }
  return used;
}

const en = flatten(JSON.parse(readFileSync(EN_PATH, "utf8")));
const es = flatten(JSON.parse(readFileSync(ES_PATH, "utf8")));
const enKeys = Object.keys(en).sort();
const esKeys = new Set(Object.keys(es));
const files = walk(SCAN_DIR);
const used = collectUsedKeys(files, en);

const missingInEsFromEn = enKeys.filter((k) => !esKeys.has(k));
const extraInEs = [...esKeys].filter((k) => !(k in en)).sort();

const missingInEn = [];
const missingInEsFromUse = [];
const unresolvedDynamic = [];

for (const [key, locations] of used) {
  if (key.startsWith("`")) {
    unresolvedDynamic.push({ key, locations: [...locations] });
    continue;
  }
  if (!resolveKey(key, en)) missingInEn.push({ key, locations: [...locations] });
  if (!resolveKey(key, es)) missingInEsFromUse.push({ key, locations: [...locations] });
}

let failed = false;

if (missingInEsFromEn.length) {
  failed = true;
  console.error(`Missing ${missingInEsFromEn.length} en.json key(s) in es.json:\n`);
  for (const k of missingInEsFromEn) console.error(`  ${k}`);
  console.error("");
}

if (extraInEs.length) {
  failed = true;
  console.error(`Extra ${extraInEs.length} key(s) in es.json not present in en.json:\n`);
  for (const k of extraInEs) console.error(`  ${k}`);
  console.error("");
}

if (missingInEn.length) {
  failed = true;
  console.error(`Used in src/ but missing from en.json (${missingInEn.length}):\n`);
  for (const { key, locations } of missingInEn.sort((a, b) => a.key.localeCompare(b.key))) {
    console.error(`  ${key}  (${locations.join(", ")})`);
  }
  console.error("");
}

if (missingInEsFromUse.length) {
  failed = true;
  console.error(`Used in src/ but missing from es.json (${missingInEsFromUse.length}):\n`);
  for (const { key, locations } of missingInEsFromUse.sort((a, b) => a.key.localeCompare(b.key))) {
    console.error(`  ${key}  (${locations.join(", ")})`);
  }
  console.error("");
}

if (unresolvedDynamic.length) {
  failed = true;
  console.error(
    `Dynamic t(\`…\${var}\`) keys could not be expanded (${unresolvedDynamic.length}):\n`,
  );
  for (const { key, locations } of unresolvedDynamic) {
    console.error(`  ${key}  (${locations.join(", ")})`);
  }
  console.error("");
}

if (failed) process.exit(1);

console.log(`i18n es complete: ${enKeys.length} en/es keys, ${used.size} used id(s) verified.`);
