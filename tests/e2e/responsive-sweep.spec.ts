import { test, expect, type Page } from "@playwright/test";
import { hasTestCreds, gotoApp, signIn } from "./helpers";

/**
 * Responsive sweep harness. For each route at the active viewport project
 * (mobile-375 / tablet-768 / tablet-1023 / desktop-1024 / desktop-1440):
 *  - asserts there is no horizontal overflow (the page does not scroll sideways)
 *  - captures a full-page screenshot to test-results/visual/<viewport>-<route>.png
 *
 * This is the verification harness for the responsiveness program: it turns
 * "is every page responsive?" into a measurable, per-viewport assertion plus a
 * reviewable screenshot for all routes, not just a hand-picked few.
 */

// Public, no-auth routes that should render for anyone.
const PUBLIC_ROUTES = [
  "/",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/how-purple-thinks",
  "/resources",
  "/charter",
  "/trust",
  "/privacy",
  "/terms",
  "/sign-in",
  "/sign-up",
  "/reset-password",
];

// Authenticated app routes (require a signed-in session).
const APP_ROUTES = [
  "/today",
  "/journal",
  "/meds",
  "/meds/history",
  "/biometrics",
  "/hydration",
  "/timeline",
  "/insights",
  "/my-health",
  "/reports",
  "/care",
  "/chat",
  "/settings",
  "/settings/sharing",
  "/settings/travel",
  "/account",
  "/tools",
  "/vitals",
  "/apple-health-import",
];

function viewportTag(page: Page): string {
  const vp = page.viewportSize();
  return vp ? `${vp.width}x${vp.height}` : "unknown";
}

function routeSlug(path: string): string {
  return path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-");
}

/** Settle: wait for any "Loading" placeholder to clear, then a short beat. */
async function settle(page: Page) {
  await expect(page.getByText(/^Loading/))
    .toHaveCount(0, { timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(500);
}

/** The page must not scroll horizontally (a small rounding slack is allowed). */
async function assertNoHorizontalOverflow(page: Page, path: string) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return { scrollW: el.scrollWidth, clientW: el.clientWidth };
  });
  expect(
    overflow.scrollW,
    `${path} scrolls horizontally (scrollWidth ${overflow.scrollW} > clientWidth ${overflow.clientW})`,
  ).toBeLessThanOrEqual(overflow.clientW + 2);
}

test.describe("responsive sweep: public routes", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`no horizontal overflow: ${path}`, async ({ page }) => {
      await gotoApp(page, path);
      await settle(page);
      await page.screenshot({
        path: `test-results/visual/${viewportTag(page)}-pub-${routeSlug(path)}.png`,
        fullPage: true,
      });
      await assertNoHorizontalOverflow(page, path);
    });
  }
});

test.describe("responsive sweep: app routes", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
    await signIn(page);
  });

  for (const path of APP_ROUTES) {
    test(`no horizontal overflow: ${path}`, async ({ page }) => {
      await gotoApp(page, path);
      await settle(page);
      await page.screenshot({
        path: `test-results/visual/${viewportTag(page)}-app-${routeSlug(path)}.png`,
        fullPage: true,
      });
      await assertNoHorizontalOverflow(page, path);
    });
  }
});
