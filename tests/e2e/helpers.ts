import { expect, type Page } from "@playwright/test";

const REMOTE_E2E =
  !!process.env.E2E_BASE_URL && !process.env.E2E_BASE_URL.includes("localhost");

/** Avoid waiting for full "load" on remote Workers; domcontentloaded is enough for UI tests. */
export async function gotoApp(page: Page, path: string) {
  await page.goto(path, {
    waitUntil: "domcontentloaded",
    timeout: REMOTE_E2E ? 60_000 : 30_000,
  });
}

function testEmail() {
  return process.env.TEST_USER_EMAIL ?? process.env.E2E_TEST_USER_EMAIL;
}

function testPassword() {
  return process.env.TEST_USER_PASSWORD ?? process.env.E2E_TEST_USER_PASSWORD;
}

/**
 * Sign in via the UI. Requires TEST_USER_EMAIL/PASSWORD or E2E_TEST_USER_* in env.
 * Specs that mutate data should call this in beforeEach and skip if env is missing.
 */
export async function signIn(page: Page) {
  const email = testEmail();
  const password = testPassword();
  if (!email || !password) return false;
  await gotoApp(page, "/sign-in");
  const emailField = page.getByPlaceholder(/email address/i);
  const passwordField = page.getByPlaceholder(/^password$/i);
  await expect(emailField).toBeEditable();
  await emailField.fill(email);
  await passwordField.fill(password);
  await expect(emailField).toHaveValue(email);
  await expect(passwordField).toHaveValue(password);
  await page.getByRole("button", { name: /^login now$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
    timeout: REMOTE_E2E ? 30_000 : 15_000,
  });
  return true;
}

export const hasTestCreds = () => !!(testEmail() && testPassword());

export async function expectNoServerError(page: Page) {
  // If the app renders a global error boundary, assert it didn't trip.
  await expect(page.locator("body")).not.toContainText(/Application error|500/i);
}