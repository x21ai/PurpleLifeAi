import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds, gotoApp } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("non-admin denied /admin", async ({ page }) => {
  await signIn(page);
  await gotoApp(page, "/admin");
  await expect(page.getByRole("heading", { name: /^Restricted$/i })).toBeVisible({
    timeout: 15_000,
  });
});