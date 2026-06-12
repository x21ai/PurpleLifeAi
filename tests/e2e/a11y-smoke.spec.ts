import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * WCAG smoke on core routes. Warn-only: violations are logged but do not fail CI yet.
 */
const CORE_ROUTES = [
  "/",
  "/sign-in",
  "/today",
  "/journal",
  "/meds",
  "/timeline",
  "/insights",
  "/biometrics",
];

test.describe("axe accessibility smoke (warn only)", () => {
  for (const path of CORE_ROUTES) {
    test(`scan ${path}`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

      if (results.violations.length > 0) {
        const summary = results.violations.map(
          (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) on ${path}`,
        );
        await testInfo.attach("axe-violations", {
          body: JSON.stringify(results.violations, null, 2),
          contentType: "application/json",
        });
        console.warn(`[axe] ${path}\n${summary.join("\n")}`);
      }

      // Warn-only gate: attach evidence but do not fail the build yet.
      expect(results.violations.length).toBeGreaterThanOrEqual(0);
    });
  }
});
