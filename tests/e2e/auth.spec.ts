import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test("sign-in renders form", async ({ page }) => {
  await gotoApp(page, "/sign-in");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i).first()).toBeVisible();
});

test("sign-up renders form", async ({ page }) => {
  await gotoApp(page, "/sign-up");
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

test("reset-password renders", async ({ page }) => {
  // This page is the landing target from the recovery email link, so it
  // renders new/confirm password fields, not an email field.
  await gotoApp(page, "/reset-password");
  await expect(page.getByLabel(/new password/i)).toBeVisible();
  await expect(page.getByLabel(/confirm password/i)).toBeVisible();
});

test("invalid sign-in stays on /sign-in", async ({ page }) => {
  await gotoApp(page, "/sign-in");
  await page.getByLabel(/email/i).fill("nobody+invalid@example.com");
  await page.getByLabel(/password/i).first().fill("wrong-password-xyz");
  await page
    .getByRole("tabpanel", { name: /sign in/i })
    .getByRole("button", { name: /^sign in$/i })
    .click();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/sign-in/);
});