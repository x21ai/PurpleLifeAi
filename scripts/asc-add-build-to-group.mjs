#!/usr/bin/env node
/**
 * Add a TestFlight build to a named beta group and submit it for Beta App
 * Review (required before Apple serves it to an external group).
 *
 * Usage: bash scripts/doppler-run-purple-life.sh node scripts/asc-add-build-to-group.mjs …
 *   node scripts/asc-add-build-to-group.mjs <buildVersion> [groupName]
 *
 * <buildVersion> is the build number (e.g. 20), not the marketing version.
 * [groupName] defaults to "Founding Team".
 *
 * Requires Doppler: APP_STORE_CONNECT_KEY_ID, ISSUER_ID, API_KEY
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP_APPLE_ID = process.env.ASC_APP_APPLE_ID?.trim() || "6787298041";
const buildVersion = process.argv[2]?.trim();
const groupName = process.argv[3]?.trim() || "Founding Team";

if (!buildVersion) {
  console.error("Usage: node scripts/asc-add-build-to-group.mjs <buildVersion> [groupName]");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jwtScript = path.join(__dirname, "lib", "asc-jwt.mjs");

function mintJwt() {
  const result = spawnSync("node", [jwtScript], { encoding: "utf8", env: process.env });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "");
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

async function ascFetch(pathname, init = {}) {
  const token = mintJwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail ?? json?.errors?.[0]?.title ?? res.statusText;
    throw new Error(`ASC ${init.method || "GET"} ${pathname} failed (${res.status}): ${detail}`);
  }
  return json;
}

async function main() {
  console.log(`[asc-add-build] Looking up build 1.0 (${buildVersion}) for app ${APP_APPLE_ID}...`);
  const builds = await ascFetch(
    `/v1/builds?filter[app]=${APP_APPLE_ID}&filter[version]=${buildVersion}&sort=-uploadedDate&limit=1`,
  );
  const build = builds?.data?.[0];
  if (!build) {
    throw new Error(`No build found with version ${buildVersion}`);
  }
  console.log(
    `[asc-add-build] Found build ${build.id} processingState=${build.attributes?.processingState}`,
  );

  console.log(`[asc-add-build] Looking up external group "${groupName}"...`);
  const groups = await ascFetch(`/v1/apps/${APP_APPLE_ID}/betaGroups?limit=50`);
  const group = (groups?.data ?? []).find(
    (g) => g.attributes?.name === groupName && g.attributes?.isInternalGroup === false,
  );
  if (!group) {
    const names = (groups?.data ?? [])
      .map((g) => `${g.attributes?.name} (internal=${g.attributes?.isInternalGroup})`)
      .join(", ");
    throw new Error(`No external beta group named "${groupName}" found. Groups: ${names}`);
  }
  console.log(`[asc-add-build] Found group ${group.id}`);

  console.log(`[asc-add-build] Adding build ${build.id} to group ${group.id}...`);
  await ascFetch(`/v1/betaGroups/${group.id}/relationships/builds`, {
    method: "POST",
    body: JSON.stringify({ data: [{ type: "builds", id: build.id }] }),
  });
  console.log(`[asc-add-build] Added.`);

  console.log(`[asc-add-build] Submitting build ${build.id} for Beta App Review...`);
  try {
    const submission = await ascFetch(`/v1/betaAppReviewSubmissions`, {
      method: "POST",
      body: JSON.stringify({
        data: { type: "betaAppReviewSubmissions", relationships: { build: { data: { type: "builds", id: build.id } } } },
      }),
    });
    console.log(
      `[asc-add-build] Submission created: betaReviewState=${submission?.data?.attributes?.betaReviewState ?? "unknown"}`,
    );
  } catch (err) {
    console.warn(`[asc-add-build] WARN: review submission failed (may already be submitted): ${err.message}`);
  }

  console.log(`[asc-add-build] Done. Re-poll with: bun run ios:check-asc-builds`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
