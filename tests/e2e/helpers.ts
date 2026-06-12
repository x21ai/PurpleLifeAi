import { expect, type Page } from "@playwright/test";

/**
 * Sign in via the UI. Requires TEST_USER_EMAIL and TEST_USER_PASSWORD in env.
 * Specs that mutate data should call this in beforeEach and skip if env is missing.
 */
export async function signIn(page: Page) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) return false;
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(password);
  await page
    .getByRole("button", { name: /sign in|log in|continue/i })
    .first()
    .click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 15_000 });
  return true;
}

export const hasTestCreds = () => !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);

export async function expectNoServerError(page: Page) {
  // If the app renders a global error boundary, assert it didn't trip.
  await expect(page.locator("body")).not.toContainText(/Application error|500/i);
}
