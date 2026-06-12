import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("meds loads", async ({ page }) => {
  await signIn(page);
  await page.goto("/meds");
  await expect(page).toHaveURL(/\/meds/);
});
