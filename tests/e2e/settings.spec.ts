import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("settings hub loads", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings/);
});
test("sharing tab loads", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings/sharing");
  await expect(page.getByRole("heading").first()).toBeVisible();
});