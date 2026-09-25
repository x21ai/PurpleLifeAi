import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getWwwRouteTarget } from "./www-routing.ts";

describe("www hybrid route boundary", () => {
  const tanstackCases = [
    ["/api/auth/sign-in", "tanstack"],
    ["/api/data/query", "tanstack"],
    ["/oauth/google/callback", "tanstack"],
    ["/oauth/whoop/callback", "tanstack"],
  ] as const;

  for (const [pathname, expected] of tanstackCases) {
    test(`${pathname} uses TanStack API/OAuth`, () => {
      assert.equal(getWwwRouteTarget(pathname), expected);
    });
  }

  const astroCases = [
    ["/", "astro"],
    ["/features", "astro"],
    ["/pricing/", "astro"],
    ["/login", "astro"],
    ["/sign-up", "astro"],
    ["/account", "astro"],
    ["/today", "astro"],
    ["/journal/new", "astro"],
    ["/meds/history/", "astro"],
    ["/biometrics/hrv", "astro"],
    ["/reports/documents", "astro"],
    ["/pilot/today", "astro"],
    ["/settings", "astro"],
  ] as const;

  for (const [pathname, expected] of astroCases) {
    test(`${pathname} uses latest Ploy Astro`, () => {
      assert.equal(getWwwRouteTarget(pathname), expected);
    });
  }

  const staticAssetCases = [
    "/assets/index.hash.js",
    "/_ploy_static/_astro/page.abc123.js",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap-index.xml",
    "/sitemap-0.xml",
    "/llms.txt",
  ];

  for (const pathname of staticAssetCases) {
    test(`${pathname} uses the static asset binding`, () => {
      assert.equal(getWwwRouteTarget(pathname), "assets");
    });
  }
});
