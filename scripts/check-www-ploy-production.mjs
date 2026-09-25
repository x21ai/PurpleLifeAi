import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

const [config, buildScript, homeSource, routingSource] = await Promise.all([
  read("wrangler.deploy.ploy.jsonc"),
  read("scripts/build-ploy-www.sh"),
  read("ploy-staging/src/components/pages/home/page.tsx"),
  read("ploy-staging/worker/www-routing.ts"),
]);

for (const expected of [
  '"DESIGN_PREVIEW": "0"',
  '"STAGING_REAL_AUTH": "1"',
  '"DATA_BACKEND": "cloudflare"',
  '"STAGING_LIVE_DATA": "1"',
  '"PUBLIC_SITE_URL": "https://www.purplelife.org"',
  '"database_id": "8d0be2b3-84ec-4581-86f4-6b372ec1d5d7"',
  '"bucket_name": "purplelifeai"',
  '"id": "9226585702aa4be694ac74981d9859c4"',
]) {
  assert.match(config, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(
  buildScript,
  /VITE_STAGING_LIVE_DATA=1 VITE_PUBLIC_SITE_ENV=production bun run build/,
);
assert.match(homeSource, /production \? "Live production" : "Static design preview"/);
assert.match(routingSource, /PLOY_LIVE_APP_ROUTES/);
assert.match(routingSource, /return "tanstack";/);

if (process.argv.includes("--built")) {
  const [homeHtml, loginHtml] = await Promise.all([
    read("ploy-staging/dist/client/index.html"),
    read("ploy-staging/dist/client/login/index.html"),
  ]);

  for (const forbidden of [
    "Static design preview",
    "Design review build",
    "Interactions use local mock state",
    "Production authentication, storage, uploads, billing, and health APIs are not connected",
  ]) {
    assert.equal(homeHtml.includes(forbidden), false, `production home contains: ${forbidden}`);
  }
  assert.match(homeHtml, /Live production/);
  assert.equal(loginHtml.includes("Sign in to staging"), false);
  assert.equal(loginHtml.includes("Testers:"), false);
}

console.log("check-www-ploy-production: PASS");
