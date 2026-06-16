import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds, gotoApp, expectNoServerError } from "./helpers";

test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("tools page no longer shows the fabricated battery card", async ({ page }) => {
  await gotoApp(page, "/tools");
  await expect(page).toHaveURL(/\/tools/);
  await expectNoServerError(page);
  // The removed hero card used a hardcoded battery + fake "Listening" status.
  await expect(page.locator("body")).not.toContainText(/Battery/i);
  await expect(page.locator("body")).not.toContainText(/Listening/i);
  // Device connections should still render.
  await expect(page.getByText(/Oura/i).first()).toBeVisible();
});

test("vitals page renders without fabricated numbers", async ({ page }) => {
  await gotoApp(page, "/vitals");
  await expect(page).toHaveURL(/\/vitals/);
  await expectNoServerError(page);
  await expect(page.getByText(/Readiness/i).first()).toBeVisible();
  // A user with no biometrics sees clearly labelled demo data.
  await expect(page.getByText(/Demo data/i).first()).toBeVisible();
});

test("my health page renders narrative and demo labelling", async ({ page }) => {
  await gotoApp(page, "/my-health");
  await expect(page).toHaveURL(/\/my-health/);
  await expectNoServerError(page);
  await expect(page.getByText(/Demo data/i).first()).toBeVisible();
});
