import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds, gotoApp } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("settings hub loads", async ({ page }) => {
  await signIn(page);
  await gotoApp(page, "/settings");
  await expect(page).toHaveURL(/\/settings/);
});
test("sharing tab loads", async ({ page }) => {
  await signIn(page);
  await gotoApp(page, "/settings/sharing");
  await expect(page).toHaveURL(/\/settings\/sharing/);
  await expect(page.getByRole("heading", { name: /sharing/i }).first()).toBeVisible({
    timeout: 15_000,
  });
});