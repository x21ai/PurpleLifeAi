import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/features", "/pricing", "/about", "/contact"];
for (const route of ROUTES) {
  test(`footer on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const footer = page.getByTestId("site-footer");
    await expect(footer).toBeVisible();
  });
}
