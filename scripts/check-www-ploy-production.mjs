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
assert.match(homeSource, /production \? "Private health journal" : "Static design preview"/);
assert.match(routingSource, /Latest Ploy design for every other route/);
assert.match(routingSource, /normalized\.startsWith\("\/api\/"\)/);
assert.match(routingSource, /return "astro";/);

if (process.argv.includes("--built")) {
  const ployRoutes = [
    "/",
    "/about",
    "/charter",
    "/contact",
    "/features",
    "/privacy",
    "/terms",
    "/trust",
    "/documents",
    "/journal",
    "/journal/new",
    "/login",
    "/meds",
    "/meds/history",
    "/reports",
    "/reports/documents",
    "/sign-in",
    "/today",
    "/tools",
  ];
  const tanstackAssets = await readdir(new URL("ploy-staging/dist/client/assets/", root));
  assert(
    tanstackAssets.some((name) => /^index-.*\.js$/.test(name)),
    "merged www bundle omitted TanStack fallback client assets",
  );

  async function readHydrationGraph(entryNames) {
    const pending = [...entryNames];
    const visited = new Set();
    const sources = [];

    while (pending.length > 0) {
      const name = pending.pop();
      if (!name || visited.has(name)) continue;
      visited.add(name);
      const source = await read(`ploy-staging/dist/client/_ploy_static/_astro/${name}`);
      sources.push(source);
      for (const match of source.matchAll(/(?:from|import)\s*(?:\(\s*)?["']\.\/([^"']+\.js)["']/g)) {
        if (!visited.has(match[1])) pending.push(match[1]);
      }
    }

    return sources.join("\n");
  }

  async function readBuiltRoute(route) {
    const relativePath =
      route === "/" ? "ploy-staging/dist/client/index.html" : `ploy-staging/dist/client${route}/index.html`;
    const html = await read(relativePath);
    const componentUrls = [
      ...html.matchAll(/component-url="\/_ploy_static\/_astro\/([^"]+\.js)"/g),
    ].map((match) => match[1]);
    const hydration = await readHydrationGraph(componentUrls);
    return { route, html, hydration };
  }

  const builtRoutes = await Promise.all(ployRoutes.map(readBuiltRoute));
  for (const forbidden of [
    "design preview",
    "design review",
    "static preview",
    "mock state",
    "pmt account",
    "staging api proxy",
    "production d1",
    "production data",
    "production authentication",
    "production worker auth path",
    "cloudflare-backed",
    "cloudflare data requests",
    "read-only on staging",
  ]) {
    for (const { route, html, hydration } of builtRoutes) {
      assert.equal(
        html.toLowerCase().includes(forbidden),
        false,
        `production ${route} HTML contains: ${forbidden}`,
      );
      assert.equal(
        hydration.toLowerCase().includes(forbidden),
        false,
        `production ${route} hydration contains: ${forbidden}`,
      );
    }
  }

  const home = builtRoutes.find(({ route }) => route === "/");
  const login = builtRoutes.find(({ route }) => route === "/login");
  assert(home);
  assert(login);
  const homeHtml = home.html;
  const homeClient = home.hydration;
  const loginHtml = login.html;
  const loginClient = login.hydration;
  assert.match(homeHtml, /Private health journal/);
  assert.match(homeClient, /Private health journal/);
  assert.equal(loginHtml.includes("Sign in to staging"), false);
  assert.equal(loginClient.includes("Sign in to staging"), false);
  assert.equal(loginHtml.includes("Testers:"), false);
  assert.equal(loginClient.includes("Testers:"), false);
  assert.match(loginClient, /Sign in to PurpleLife/);
}

console.log("check-www-ploy-production: PASS");
