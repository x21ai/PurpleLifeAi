import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("today loads", async ({ page }) => {
  await signIn(page);
  await page.goto("/today");
  await expect(page.locator("body")).not.toContainText(/Application error/i);
});
