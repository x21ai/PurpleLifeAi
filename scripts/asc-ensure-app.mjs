#!/usr/bin/env node
/**
 * Ensure org.purplelife.app exists in App Store Connect (create app record if missing).
 * Requires Doppler secrets: APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID,
 * APP_STORE_CONNECT_API_KEY
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BUNDLE_ID = "org.purplelife.app";
const APP_NAME = "Purple";
const SKU = "purple-life-ios-001";
const PRIMARY_LOCALE = "en-US";

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

async function ascFetch(pathname, { method = "GET", body } = {}) {
  const token = mintJwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail ?? json?.errors?.[0]?.title ?? text;
    throw new Error(`ASC ${method} ${pathname} failed (${res.status}): ${detail}`);
  }
  return json;
}

async function findBundleIdResource() {
  const q = encodeURIComponent(BUNDLE_ID);
  const data = await ascFetch(`/v1/bundleIds?filter[identifier]=${q}&limit=1`);
  const hit = data?.data?.[0];
  if (!hit?.id) {
    throw new Error(
      `Bundle ID ${BUNDLE_ID} not found in Apple Developer. Register it in the Developer portal (with HealthKit), then re-run.`,
    );
  }
  return hit.id;
}

async function findExistingApp() {
  const q = encodeURIComponent(BUNDLE_ID);
  const data = await ascFetch(`/v1/apps?filter[bundleId]=${q}&limit=1`);
  return data?.data?.[0] ?? null;
}

async function createApp(bundleIdResourceId) {
  const payload = {
    data: {
      type: "apps",
      attributes: {
        bundleId: BUNDLE_ID,
        name: APP_NAME,
        primaryLocale: PRIMARY_LOCALE,
        sku: SKU,
      },
      relationships: {
        bundleId: {
          data: { type: "bundleIds", id: bundleIdResourceId },
        },
      },
    },
  };
  const created = await ascFetch("/v1/apps", { method: "POST", body: payload });
  return created?.data;
}

async function main() {
  const existing = await findExistingApp();
  if (existing) {
    console.log(`App Store Connect app already exists: ${existing.id} (${BUNDLE_ID})`);
    return;
  }

  const bundleIdResourceId = await findBundleIdResource();
  const created = await createApp(bundleIdResourceId);
  console.log(`Created App Store Connect app: ${created?.id} (${BUNDLE_ID})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
