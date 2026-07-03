import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test("sign-in renders form", async ({ page }) => {
  await gotoApp(page, "/sign-in");
  await expect(page.getByPlaceholder(/email address/i)).toBeVisible();
  await expect(page.getByPlaceholder(/^password$/i)).toBeVisible();
});

test("sign-up renders form", async ({ page }) => {
  await gotoApp(page, "/sign-up");
  await expect(page.getByPlaceholder(/email address/i)).toBeVisible();
});

test("reset-password renders", async ({ page }) => {
  // This page is the landing target from the recovery email link, so it
  // renders new/confirm password fields, not an email field.
  await gotoApp(page, "/reset-password");
  await expect(page.getByLabel(/new password/i)).toBeVisible();
  await expect(page.getByLabel(/confirm password/i)).toBeVisible();
});

test("sign-up with an already-registered email shows a clear message", async ({ page }) => {
  // Supabase signUp on an existing confirmed email is a no-op server-side
  // (enumeration protection returns an obfuscated user), so this cannot
  // break the e2e account. Any valid-looking password works.
  await gotoApp(page, "/sign-in");
  await page.getByRole("button", { name: /create a new account now/i }).click();
  await page.getByPlaceholder(/email address/i).fill("e2e-smoke@purplelife.org");
  await page.getByPlaceholder(/^password$/i).fill("not-the-real-password-123");
  await page.getByRole("button", { name: /^create account$/i }).click();
  await expect(
    page.getByText(/already has a Purple account/i).first(),
  ).toBeVisible({ timeout: 20_000 });
  // Must not show the generic verify-sent screen.
  await expect(page.getByText(/check your inbox/i)).not.toBeVisible();
  // Auto-switched back to sign in with the email kept.
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByPlaceholder(/email address/i)).toHaveValue("e2e-smoke@purplelife.org");
});

test("invalid sign-in stays on /sign-in", async ({ page }) => {
  await gotoApp(page, "/sign-in");
  await page.getByPlaceholder(/email address/i).fill("nobody+invalid@example.com");
  await page.getByPlaceholder(/^password$/i).fill("wrong-password-xyz");
  await page.getByRole("button", { name: /^login now$/i }).click();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/\/sign-in/);
});