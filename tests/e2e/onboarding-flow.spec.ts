import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { gotoApp } from "./helpers";

/**
 * Full new-user flow: sign-up (admin-created, confirmed) through the 2-step
 * onboarding to the first journal entry and its extraction state, asserting
 * the whole path takes 6 or fewer navigations.
 *
 * Needs admin access to mint a confirmed user, so it skips unless both
 * E2E_SUPABASE_URL and E2E_SUPABASE_SERVICE_ROLE_KEY are set.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

async function createConfirmedUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  password: string,
) {
  let lastError: { message?: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (!error && data.user) return data.user.id;
    lastError = error;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  expect(lastError).toBeNull();
  throw new Error("createUser failed");
}

test("new user reaches confirmed extraction in 6 navigations or fewer", async ({ page }) => {
  test.skip(!SUPABASE_URL || !SERVICE_ROLE, "needs E2E_SUPABASE_SERVICE_ROLE_KEY");
  test.setTimeout(120_000);

  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!);
  const email = `e2e-onboarding-${Date.now()}@purplelife.org`;
  const password = `pw-${crypto.randomUUID()}`;
  const userId = await createConfirmedUser(admin, email, password);

  // Count document-level navigations (URL pathname changes).
  const visited: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const path = new URL(frame.url()).pathname;
    if (visited[visited.length - 1] !== path) visited.push(path);
  });

  try {
    // Nav 1: sign-in
    await gotoApp(page, "/sign-in");
    await page.getByLabel(/email/i).fill(email);
    await page
      .getByLabel(/password/i)
      .first()
      .fill(password);
    await page
      .getByRole("tabpanel", { name: /sign in/i })
      .getByRole("button", { name: /^sign in$/i })
      .click();

    // Nav 2: un-onboarded users land on /welcome
    await page.waitForURL(/\/welcome/, { timeout: 20_000 });

    // Step 1 of 2: first name + conditions (no navigation)
    await page.getByLabel(/first name/i).fill("River");
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2 of 2: tell Purple about today
    await expect(page.getByText(/tell purple about today/i)).toBeVisible();
    // Example chips exist and fill the box
    await page.getByRole("button", { name: /slept badly/i }).click();
    await page.getByRole("button", { name: /^save$/i }).click();

    // Extraction either confirms (with AI configured) or falls back to the
    // calm "still reading" state; both complete the loop.
    await expect(page.getByText(/your words, remembered|your first entry is in/i)).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /take me in/i }).click();

    // Nav 3: Today
    await page.waitForURL(/\/today/, { timeout: 20_000 });

    const clientNavigations = visited.length;
    expect(clientNavigations).toBeLessThanOrEqual(6);

    // The entry actually exists in the journal.
    const { count } = await admin
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count).toBeGreaterThanOrEqual(1);
  } finally {
    await admin.auth.admin.deleteUser(userId).catch(() => null);
  }
});
