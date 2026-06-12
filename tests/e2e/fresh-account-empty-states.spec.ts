import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Fresh-account empty states on Today, Timeline, Insights (For you),
 * Patterns tab, and Biometrics. Skips unless admin creds are available,
 * same contract as tests/e2e/onboarding-flow.spec.ts.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

test("fresh account sees designed empty states on core routes", async ({ page }) => {
  test.skip(!SUPABASE_URL || !SERVICE_ROLE, "needs E2E_SUPABASE_SERVICE_ROLE_KEY");
  test.setTimeout(120_000);

  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!);
  const email = `e2e-empty-${Date.now()}@purplelife.org`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  const userId = created!.user!.id;

  try {
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
    await page.waitForURL(/\/welcome/, { timeout: 20_000 });

    await page.getByLabel(/first name/i).fill("River");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /skip/i }).click();
    await page.waitForURL(/\/today/, { timeout: 20_000 });

    await expect(page.getByTestId("fresh-empty-today")).toBeVisible();
    await expect(page.getByText(/start where you are/i)).toBeVisible();
    await expect(page.locator("text=Readiness")).toHaveCount(0);

    await page.goto("/timeline");
    await expect(page.getByTestId("fresh-empty-timeline")).toBeVisible();
    await expect(page.getByRole("link", { name: /write your first entry/i })).toBeVisible();

    await page.goto("/insights");
    await expect(page.getByTestId("fresh-empty-insights")).toBeVisible();
    await expect(page.getByText(/avg sleep/i)).toHaveCount(0);

    await page.getByRole("tab", { name: /^patterns$/i }).click();
    await expect(page.getByTestId("fresh-empty-patterns")).toBeVisible();
    await expect(page.getByRole("link", { name: /log how today feels/i })).toBeVisible();

    await page.goto("/biometrics");
    await expect(page.getByTestId("fresh-empty-biometrics")).toBeVisible();
    await expect(page.getByRole("link", { name: /connect a device/i })).toBeVisible();
    await expect(page.getByText(/vs previous/i)).toHaveCount(0);

    const { count: journalCount } = await admin
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(journalCount).toBe(0);
  } finally {
    await admin.auth.admin.deleteUser(userId).catch(() => null);
  }
});
