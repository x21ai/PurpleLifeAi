import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/welcome", "/today", "/biometrics", "/community", "/settings"];

for (const route of ROUTES) {
  test(`footer visibility on ${route}`, async ({ page, viewport }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    // Some routes may redirect to /login when unauthenticated; that's OK — still asserts footer behavior.
    expect(response?.status() ?? 0).toBeLessThan(500);

    const footer = page.getByTestId("site-footer");
    const width = viewport?.width ?? 0;

    if (width >= 1024) {
      await expect(footer).toBeVisible();
    } else {
      await expect(footer).toHaveCount(0).catch(async () => {
        await expect(footer).toBeHidden();
      });
    }
  });
}