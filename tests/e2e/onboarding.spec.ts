import { test, expect } from "@playwright/test";

test("logged-out /welcome redirects", async ({ page }) => {
  await page.goto("/welcome");
  await page.waitForLoadState("domcontentloaded");
  await expect(page).toHaveURL(/\/sign-in|\/welcome/);
});