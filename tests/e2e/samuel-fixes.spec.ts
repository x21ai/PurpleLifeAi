import { test, expect, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { hasTestCreds, gotoApp } from "./helpers";

const SUPABASE_URL = process.env.E2E_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? process.env.E2E_TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? process.env.E2E_TEST_USER_PASSWORD;

/**
 * Fill an input and confirm the value stuck. Mobile webkit (iPhone 13 emulation)
 * intermittently drops a fast `fill()`, so retry, then fall back to typing
 * character-by-character which is reliable on webkit.
 */
async function robustFill(locator: Locator, value: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await locator.click();
    await locator.fill("");
    await locator.fill(value);
    if ((await locator.inputValue()) === value) return;
    await locator.page().waitForTimeout(300);
  }
  await locator.fill("");
  await locator.pressSequentially(value, { delay: 20 });
  await expect(locator).toHaveValue(value);
}

/** Sign in with the env test user, hardened against the mobile webkit fill race. */
async function signInRobust(page: Page) {
  await gotoApp(page, "/sign-in");
  await robustFill(page.getByPlaceholder(/email address/i), TEST_EMAIL!);
  await robustFill(page.getByPlaceholder(/^password$/i), TEST_PASSWORD!);
  await page.getByRole("button", { name: /^login now$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 30_000 });
}

/**
 * Fix 1 (light): the verify-sent screen offers a cross-device fallback link.
 * The signup network call is intercepted to return a user with no session
 * (the email-confirmation response shape), so the client shows the verify-sent
 * state without creating a real account. The full cross-device auto-advance is
 * checked manually.
 */
test("verify-sent screen offers a cross-device sign-in fallback", async ({ page }) => {
  const email = `e2e-verify-${Date.now()}@example.com`;
  await page.route("**/auth/v1/signup**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          aud: "authenticated",
          role: "authenticated",
          email,
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          confirmation_sent_at: new Date().toISOString(),
        },
        session: null,
      }),
    });
  });

  await gotoApp(page, "/sign-up"); // redirects to /sign-in#register
  const emailField = page.getByPlaceholder(/email address/i);
  await expect(emailField).toBeEditable();
  await robustFill(emailField, email);
  await robustFill(page.getByPlaceholder(/^password$/i), `pw-${Date.now()}aA1!`);
  await page
    .locator("form")
    .getByRole("button", { name: /create account/i })
    .click();

  await expect(
    page.getByRole("button", { name: /confirmed on another device\? sign in/i }),
  ).toBeVisible({ timeout: 15_000 });
});

/**
 * Fix 3: the Add medication sheet opens with the Prescriber section visible
 * (open by default) and the body scrolls so the bottom fields are reachable.
 */
test("medication form shows Prescriber section and scrolls to the bottom", async ({ page }) => {
  test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
  await signInRobust(page);
  await gotoApp(page, "/meds");
  await expect(page).toHaveURL(/\/meds/);

  const addButton = page.getByRole("button", { name: /add a medication/i }).first();
  await addButton.waitFor({ state: "visible" });
  await addButton.click();
  const prescriber = page.getByLabel(/prescriber name/i);
  await prescriber.scrollIntoViewIfNeeded();
  await expect(prescriber).toBeVisible();
});

/**
 * Fix 4: the report-detail header no longer renders the dead settings gear.
 */
test("report shell header has no settings gear", async ({ page }) => {
  test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
  await signInRobust(page);
  await gotoApp(page, "/reports/new");
  await expect(page.getByText(/upload report/i).first()).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: /settings/i })).toHaveCount(0);
});

/**
 * Fix 2: onboarding writes first and last name to separate profile columns
 * instead of concatenating both into first_name. Mints a confirmed throwaway
 * user, drives /welcome, and asserts the split via an admin read. Cleans up.
 */
test("onboarding stores first and last name in separate columns", async ({ page }) => {
  test.skip(!SUPABASE_URL || !SERVICE_ROLE, "needs E2E_SUPABASE_SERVICE_ROLE_KEY");
  test.setTimeout(120_000);

  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!);
  const email = `e2e-name-${Date.now()}@purplelife.org`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  const userId = created!.user!.id;

  try {
    await gotoApp(page, "/sign-in");
    await robustFill(page.getByPlaceholder(/email address/i), email);
    await robustFill(page.getByPlaceholder(/^password$/i), password);
    await page.getByRole("button", { name: /^login now$/i }).click();

    await page.waitForURL(/\/welcome/, { timeout: 20_000 });
    await page.getByLabel(/first name/i).fill("River");
    await page.getByLabel(/last name/i).fill("Stone");
    await page.getByRole("button", { name: /skip/i }).click();
    await page.waitForURL(/\/today/, { timeout: 20_000 });

    // Poll the profile until the upsert lands.
    let firstName: string | null = null;
    let lastName: string | null = null;
    for (let i = 0; i < 10; i++) {
      const { data: prof } = await admin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();
      firstName = (prof?.first_name as string | null) ?? null;
      lastName = (prof?.last_name as string | null) ?? null;
      if (firstName && lastName) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    expect(firstName).toBe("River");
    expect(lastName).toBe("Stone");
  } finally {
    await admin.auth.admin.deleteUser(userId).catch(() => null);
  }
});
