import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

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
assert.match(homeSource, /production \? "Live production" : "Static design preview"/);
assert.match(routingSource, /PLOY_LIVE_APP_ROUTES/);
assert.match(routingSource, /return "tanstack";/);

if (process.argv.includes("--built")) {
  const [homeHtml, loginHtml, tanstackAssets] = await Promise.all([
    read("ploy-staging/dist/client/index.html"),
    read("ploy-staging/dist/client/login/index.html"),
    readdir(new URL("ploy-staging/dist/client/assets/", root)),
  ]);
  assert(
    tanstackAssets.some((name) => /^index-.*\.js$/.test(name)),
    "merged www bundle omitted TanStack fallback client assets",
  );
  async function readHydrationComponent(html) {
    const componentUrl = html.match(/component-url="\/_ploy_static\/_astro\/([^"]+\.js)"/)?.[1];
    assert(componentUrl, "prerendered page omitted its hydration component URL");
    return read(`ploy-staging/dist/client/_ploy_static/_astro/${componentUrl}`);
  }
  const [homeClient, loginClient] = await Promise.all([
    readHydrationComponent(homeHtml),
    readHydrationComponent(loginHtml),
  ]);

  for (const forbidden of [
    "Static design preview",
    "Design review build",
    "Interactions use local mock state",
    "Production authentication, storage, uploads, billing, and health APIs are not connected",
  ]) {
    assert.equal(homeHtml.includes(forbidden), false, `production home contains: ${forbidden}`);
    assert.equal(homeClient.includes(forbidden), false, `production home hydration contains: ${forbidden}`);
  }
  assert.match(homeHtml, /Live production/);
  assert.match(homeClient, /Live production/);
  assert.equal(loginHtml.includes("Sign in to staging"), false);
  assert.equal(loginClient.includes("Sign in to staging"), false);
  assert.equal(loginHtml.includes("Testers:"), false);
  assert.equal(loginClient.includes("Testers:"), false);
  assert.match(loginClient, /Sign in to PurpleLife/);
}

console.log("check-www-ploy-production: PASS");
