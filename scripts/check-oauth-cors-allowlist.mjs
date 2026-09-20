#!/usr/bin/env bun
/**
 * L0 gate: OAuth/CORS allowlists stay explicit (no wildcard origins).
 * Run: bun run check:oauth-cors
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const originsPath = join(root, "src/lib/oauth-allowed-origins.ts");
const corsPath = join(root, "src/lib/flutter-api-cors.ts");

const originsSrc = readFileSync(originsPath, "utf8");
const corsSrc = readFileSync(corsPath, "utf8");

let failed = false;

if (originsSrc.includes('Access-Control-Allow-Origin", "*"') || originsSrc.includes("'*'")) {
  console.error("check-oauth-cors: wildcard origin in oauth-allowed-origins.ts");
  failed = true;
}

if (corsSrc.includes('"*"') || corsSrc.includes("'*'")) {
  console.error("check-oauth-cors: wildcard origin in flutter-api-cors.ts");
  failed = true;
}

const requiredOrigins = [
  "https://www.purplelife.org",
  "http://127.0.0.1:8765",
  "http://localhost:8765",
];

for (const origin of requiredOrigins) {
  if (!originsSrc.includes(`"${origin}"`)) {
    console.error(`check-oauth-cors: missing required origin ${origin}`);
    failed = true;
  }
}

const requiredCorsPaths = [
  "/api/care/today",
  "/api/care/meds",
  "/api/chat",
  "/api/health/whoop-exchange",
];

for (const path of requiredCorsPaths) {
  if (!corsSrc.includes(`"${path}"`)) {
    console.error(`check-oauth-cors: missing CORS path ${path}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("check-oauth-cors: allowlists OK");
