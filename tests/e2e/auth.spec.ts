import { test, expect } from "@playwright/test";

test("sign-in renders form", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i).first()).toBeVisible();
});

test("sign-up renders form", async ({ page }) => {
  await page.goto("/sign-up");
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

test("reset-password renders", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

test("invalid sign-in stays on /sign-in", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("nobody+invalid@example.com");
  await page.getByLabel(/password/i).first().fill("wrong-password-xyz");
  await page.getByRole("button", { name: /sign in|log in|continue/i }).first().click();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/sign-in/);
});