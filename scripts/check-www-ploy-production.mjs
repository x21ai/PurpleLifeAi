import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertBuiltPloyLiveCopy } from "./lib/ploy-live-copy.mjs";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

const [config, buildScript, astroConfig, homeSource, routingSource] = await Promise.all([
  read("wrangler.deploy.ploy.jsonc"),
  read("scripts/build-ploy-www.sh"),
  read("ploy-staging/astro.config.mjs"),
  read("ploy-staging/src/components/pages/home/page.tsx"),
  read("ploy-staging/worker/www-routing.ts"),
]);

for (const expected of [
  '"DESIGN_PREVIEW": "0"',
  '"STAGING_REAL_AUTH": "1"',
  '"DATA_BACKEND": "cloudflare"',
  '"STAGING_LIVE_DATA": "1"',
  '"PUBLIC_SITE_URL": "https://www.purplelife.org"',
  '"run_worker_first": true',
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
assert.match(astroConfig, /envPrefix: \["PUBLIC_", "VITE_"\]/);
assert.match(homeSource, /production \? "Private health journal" : "Static design preview"/);
assert.match(routingSource, /Latest Ploy design for every other route/);
assert.match(routingSource, /normalized\.startsWith\("\/api\/"\)/);
assert.match(routingSource, /return "astro";/);

if (process.argv.includes("--built")) {
  const { home } = await assertBuiltPloyLiveCopy(root, read, "production");
  assert.match(home.html, /rel="canonical" href="https:\/\/www\.purplelife\.org\/"/);
}

console.log("check-www-ploy-production: PASS");
