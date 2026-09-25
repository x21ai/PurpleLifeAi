import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getWwwRouteTarget } from "./www-routing.ts";

describe("www hybrid route boundary", () => {
  const tanstackCases = [
    ["/api/auth/sign-in", "tanstack"],
    ["/api/data/query", "tanstack"],
    ["/oauth/google/callback", "tanstack"],
    ["/account", "tanstack"],
    ["/biometrics/hrv", "tanstack"],
    ["/pricing/", "tanstack"],
    ["/reports/journal-summary", "tanstack"],
    ["/sign-up", "tanstack"],
    ["/reset-password", "tanstack"],
  ] as const;

  for (const [pathname, expected] of tanstackCases) {
    test(`${pathname} uses the production TanStack app`, () => {
      assert.equal(getWwwRouteTarget(pathname), expected);
    });
  }

  const astroCases = [
    ["/", "astro"],
    ["/features", "astro"],
    ["/login", "astro"],
    ["/today", "astro"],
    ["/journal/new", "astro"],
    ["/meds/history/", "astro"],
    ["/reports/documents", "astro"],
    ["/_astro/page.abc123.js", "astro"],
  ] as const;

  for (const [pathname, expected] of astroCases) {
    test(`${pathname} uses production-wired Ploy`, () => {
      assert.equal(getWwwRouteTarget(pathname), expected);
    });
  }
});
