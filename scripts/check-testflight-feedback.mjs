#!/usr/bin/env node
/**
 * Combined TestFlight feedback check: App Store Connect + Luciq.
 *
 * Usage:
 *   bash scripts/doppler-run-purple-life.sh node scripts/check-testflight-feedback.mjs
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(label, script) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync("node", [script], {
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
}

const ascScript = path.join(__dirname, "asc-list-testflight-feedback.mjs");
const luciqScript = path.join(__dirname, "luciq-fetch-reports.mjs");

const ascStatus = run("App Store Connect beta feedback", ascScript);
const luciqStatus = run("Luciq crash reporting", luciqScript);

if (ascStatus !== 0) process.exit(ascStatus);
process.exit(luciqStatus);
