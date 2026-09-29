import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertBuiltPloyLiveCopy } from "./lib/ploy-live-copy.mjs";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

const [config, buildScript, packageJson, astroConfig] = await Promise.all([
  read("wrangler.staging.jsonc"),
  read("scripts/build-ploy-staging.sh"),
  read("package.json"),
  read("ploy-staging/astro.config.mjs"),
]);

for (const expected of [
  '"name": "purplelife-staging"',
  '"main": "ploy-staging/worker/www-entry.ts"',
  '"pattern": "staging.purplelife.org/*"',
  '"run_worker_first": true',
  '"binding": "SELF"',
  '"service": "purplelife-staging"',
  '"DESIGN_PREVIEW": "0"',
  '"STAGING_REAL_AUTH": "1"',
  '"DATA_BACKEND": "cloudflare"',
  '"STAGING_LIVE_DATA": "1"',
  '"PUBLIC_SITE_URL": "https://staging.purplelife.org"',
  '"database_id": "8d0be2b3-84ec-4581-86f4-6b372ec1d5d7"',
  '"bucket_name": "purplelifeai"',
  '"id": "9226585702aa4be694ac74981d9859c4"',
]) {
  assert.match(config, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.equal(config.includes('"service": "purplelife"'), false, "staging must not bind the prod worker");
assert.equal(config.includes('"binding": "PROD"'), false, "staging must not proxy API through PROD");
assert.equal(config.includes("staging-entry"), false, "staging deploy entry is www-entry");
assert.equal(config.includes('"crons"'), false, "staging must not schedule prod crons");
assert.equal(config.includes("DESIGN_PREVIEW_USER_"), false, "staging must not pin a preview user");
assert.equal(config.includes("73356a0e339447059bdddc33b93f26a9"), false, "POS KV id is the wrong account");

assert.match(
  buildScript,
  /VITE_STAGING_LIVE_DATA=1 VITE_PUBLIC_SITE_ENV=production bun run build/,
);
assert.match(buildScript, /https:\/\/staging\.purplelife\.org/);
assert.match(astroConfig, /envPrefix: \["PUBLIC_", "VITE_"\]/);
assert.match(packageJson, /"build:staging:ploy": "bun run build:prod && bash scripts\/build-ploy-staging\.sh"/);

if (process.argv.includes("--built")) {
  const { home } = await assertBuiltPloyLiveCopy(root, read, "staging");
  assert.match(home.html, /rel="canonical" href="https:\/\/staging\.purplelife\.org\/"/);
  assert.equal(
    home.html.includes("https://www.purplelife.org"),
    false,
    "staging home canonical or copy points at www",
  );
}

console.log("check-staging-ploy-live: PASS");
