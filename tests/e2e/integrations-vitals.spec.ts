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
  // Without biometrics, vitals show empty states, not invented scores.
  await expect(page.locator("body")).not.toContainText(/5,511|5511|Demo data/i);
  await expect(page.getByText(/No data yet|No data/i).first()).toBeVisible();
});

test("my health page renders connect prompt without fake metrics", async ({ page }) => {
  await gotoApp(page, "/my-health");
  await expect(page).toHaveURL(/\/my-health/);
  await expectNoServerError(page);
  await expect(page.locator("body")).not.toContainText(/5,511|5511|Demo data|Typical sleep score/i);
  await expect(page.getByText(/Connect a device|No data yet/i).first()).toBeVisible();
});
