import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds, gotoApp } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("invite sheet opens", async ({ page }) => {
  await signIn(page);
  await gotoApp(page, "/settings/sharing");
  await page.getByRole("button", { name: /invite/i }).first().click();
  await expect(page.getByText(/invite someone/i).first()).toBeVisible({
    timeout: 15_000,
  });
});