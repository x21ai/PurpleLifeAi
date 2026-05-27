import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("invite sheet opens", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings/sharing");
  await page.getByRole("button", { name: /invite/i }).first().click();
  await expect(page.getByRole("heading", { name: /invite someone/i })).toBeVisible();
});