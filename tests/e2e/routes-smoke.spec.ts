import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/features", "/pricing", "/about", "/contact", "/how-purple-thinks", "/resources", "/sign-in", "/sign-up", "/reset-password"];
for (const path of PUBLIC_ROUTES) {
  test(`public route ${path} loads`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).not.toContainText(/Application error/i);
    // No uncaught console errors on first paint.
    expect(
      consoleErrors.filter((e) => !/Failed to load resource/i.test(e)),
    ).toEqual([]);
  });
}

const AUTH_ROUTES = ["/today", "/biometrics", "/journal", "/meds", "/settings", "/settings/sharing"];
for (const path of AUTH_ROUTES) {
  test(`auth route ${path} redirects when logged out`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/sign-in|\/welcome|\/$/);
  });
}