#!/usr/bin/env node
/**
 * List TestFlight screenshot + crash feedback for Purple (org.purplelife.app).
 * Requires Doppler x21/prd: PURPLE_LIFE_APP_STORE_CONNECT_* (via doppler-run-purple-life.sh)
 *
 *   bash scripts/doppler-run-purple-life.sh node scripts/asc-list-testflight-feedback.mjs
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP_APPLE_ID = process.env.ASC_APP_APPLE_ID?.trim() || "6787298041";
const LIMIT = Number.parseInt(process.env.ASC_FEEDBACK_LIMIT || "50", 10);
const asJson = process.argv.includes("--json");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jwtScript = path.join(__dirname, "lib", "asc-jwt.mjs");

function mintJwt() {
  const result = spawnSync("node", [jwtScript], {
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "");
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

async function ascFetch(pathname) {
  const token = mintJwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail ?? json?.errors?.[0]?.title ?? res.statusText;
    throw new Error(`ASC GET ${pathname} failed (${res.status}): ${detail}`);
  }
  return json;
}

function mapScreenshot(row) {
  const a = row.attributes ?? {};
  return {
    id: row.id,
    type: "screenshot",
    createdDate: a.createdDate,
    email: a.email,
    comment: a.comment,
    deviceModel: a.deviceModel,
    osVersion: a.osVersion,
    timeZone: a.timeZone,
    locale: a.locale,
    screenshotUrl: a.screenshots?.[0]?.url ?? null,
  };
}

function mapCrash(row) {
  const a = row.attributes ?? {};
  return {
    id: row.id,
    type: "crash",
    createdDate: a.createdDate,
    email: a.email,
    comment: a.comment,
    deviceModel: a.deviceModel,
    osVersion: a.osVersion,
    crashLogAvailable: a.crashLogAvailable,
  };
}

async function main() {
  const [screenshots, crashes] = await Promise.all([
    ascFetch(`/v1/apps/${APP_APPLE_ID}/betaFeedbackScreenshotSubmissions?limit=${LIMIT}`),
    ascFetch(`/v1/apps/${APP_APPLE_ID}/betaFeedbackCrashSubmissions?limit=${LIMIT}`),
  ]);

  const items = [
    ...(screenshots?.data ?? []).map(mapScreenshot),
    ...(crashes?.data ?? []).map(mapCrash),
  ].sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate)));

  if (asJson) {
    console.log(JSON.stringify({ appAppleId: APP_APPLE_ID, count: items.length, items }, null, 2));
    return;
  }

  console.log(`[asc-feedback] App ${APP_APPLE_ID}: ${items.length} submission(s)`);
  for (const item of items) {
    console.log("---");
    console.log(`${item.type} ${item.createdDate} ${item.email ?? "anonymous"}`);
    if (item.comment) console.log(`  comment: ${item.comment}`);
    if (item.timeZone) console.log(`  tz: ${item.timeZone}`);
    if (item.screenshotUrl) console.log(`  screenshot: ${item.screenshotUrl}`);
    if (item.crashLogAvailable != null) console.log(`  crashLog: ${item.crashLogAvailable}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
