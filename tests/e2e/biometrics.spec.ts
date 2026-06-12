import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("biometrics loads", async ({ page }) => {
  await signIn(page);
  await page.goto("/biometrics");
  await expect(page).toHaveURL(/\/biometrics/);
});
