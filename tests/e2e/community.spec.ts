import { test, expect } from "@playwright/test";
test("community feed loads", async ({ page }) => {
  await page.goto("/community");
  await expect(page.locator("body")).not.toContainText(/Application error/i);
});
test("community resources loads", async ({ page }) => {
  await page.goto("/community/resources");
  await expect(page.locator("body")).not.toContainText(/Application error/i);
});
