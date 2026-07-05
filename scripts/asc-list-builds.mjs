#!/usr/bin/env node
/**
 * List recent TestFlight builds for Purple (org.purplelife.app) via App Store Connect API.
 * Requires Doppler: APP_STORE_CONNECT_KEY_ID, ISSUER_ID, API_KEY
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP_APPLE_ID = process.env.ASC_APP_APPLE_ID?.trim() || "6787298041";
const LIMIT = Number.parseInt(process.env.ASC_BUILD_LIMIT || "5", 10);

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

async function main() {
  const builds = await ascFetch(
    `/v1/builds?filter[app]=${APP_APPLE_ID}&sort=-uploadedDate&limit=${LIMIT}&include=preReleaseVersion,buildBetaDetail`,
  );

  const included = new Map();
  for (const item of builds?.included ?? []) {
    included.set(`${item.type}:${item.id}`, item);
  }

  const rows = (builds?.data ?? []).map((b) => {
    const versionRel = b.relationships?.preReleaseVersion?.data;
    const betaRel = b.relationships?.buildBetaDetail?.data;
    const version = versionRel
      ? included.get(`${versionRel.type}:${versionRel.id}`)
      : null;
    const beta = betaRel ? included.get(`${betaRel.type}:${betaRel.id}`) : null;
    return {
      id: b.id,
      version: b.attributes?.version,
      marketing: version?.attributes?.version ?? "?",
      processingState: b.attributes?.processingState,
      uploadedDate: b.attributes?.uploadedDate,
      internalBuildState: beta?.attributes?.internalBuildState,
      externalBuildState: beta?.attributes?.externalBuildState,
      expired: b.attributes?.expired,
    };
  });

  if (rows.length === 0) {
    console.log(`[asc-builds] No builds found for app ${APP_APPLE_ID}`);
    return;
  }

  console.log(`[asc-builds] Latest builds for app ${APP_APPLE_ID}:`);
  for (const row of rows) {
    console.log(
      `  1.0 (${row.version}) id=${row.id} processing=${row.processingState} ` +
        `internal=${row.internalBuildState ?? "n/a"} external=${row.externalBuildState ?? "n/a"} ` +
        `uploaded=${row.uploadedDate ?? "n/a"}`,
    );
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
