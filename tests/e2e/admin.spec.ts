import { test, expect } from "@playwright/test";
import { signIn, hasTestCreds } from "./helpers";
test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
test("non-admin denied /admin", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin");
  const url = page.url();
  const text = await page.locator("body").innerText();
  expect(!/\/admin$/.test(url) || /forbidden|not allowed|access denied/i.test(text)).toBeTruthy();
});