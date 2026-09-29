import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";

export const LIVE_PLOY_ROUTES = [
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

export const LIVE_COPY_FORBIDDEN = [
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
];

async function readHydrationGraph(read, entryNames) {
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

async function readBuiltRoute(read, route) {
  const relativePath =
    route === "/" ? "ploy-staging/dist/client/index.html" : `ploy-staging/dist/client${route}/index.html`;
  const html = await read(relativePath);
  const componentUrls = [...html.matchAll(/component-url="\/_ploy_static\/_astro\/([^"]+\.js)"/g)].map(
    (match) => match[1],
  );
  const hydration = await readHydrationGraph(read, componentUrls);
  return { route, html, hydration };
}

/**
 * Reject design-preview/mock copy in a built Ploy client, and require the
 * live home/login strings used by www and staging.
 */
export async function assertBuiltPloyLiveCopy(root, read, label) {
  const tanstackAssets = await readdir(new URL("ploy-staging/dist/client/assets/", root));
  assert(
    tanstackAssets.some((name) => /^index-.*\.js$/.test(name)),
    `merged ${label} bundle omitted TanStack fallback client assets`,
  );

  const builtRoutes = await Promise.all(LIVE_PLOY_ROUTES.map((route) => readBuiltRoute(read, route)));
  for (const forbidden of LIVE_COPY_FORBIDDEN) {
    for (const { route, html, hydration } of builtRoutes) {
      assert.equal(
        html.toLowerCase().includes(forbidden),
        false,
        `${label} ${route} HTML contains: ${forbidden}`,
      );
      assert.equal(
        hydration.toLowerCase().includes(forbidden),
        false,
        `${label} ${route} hydration contains: ${forbidden}`,
      );
    }
  }

  const home = builtRoutes.find(({ route }) => route === "/");
  const login = builtRoutes.find(({ route }) => route === "/login");
  assert(home);
  assert(login);
  assert.match(home.html, /Private health journal/);
  assert.match(home.hydration, /Private health journal/);
  assert.equal(login.html.includes("Sign in to staging"), false);
  assert.equal(login.hydration.includes("Sign in to staging"), false);
  assert.equal(login.html.includes("Testers:"), false);
  assert.equal(login.hydration.includes("Testers:"), false);
  assert.match(login.hydration, /Sign in to PurpleLife/);
  return { home, login, builtRoutes };
}
