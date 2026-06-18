import { test, expect, type Locator, type Page } from "@playwright/test";
import { hasTestCreds, gotoApp } from "./helpers";

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? process.env.E2E_TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? process.env.E2E_TEST_USER_PASSWORD;

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

async function signInRobust(page: Page) {
  await gotoApp(page, "/sign-in");
  await robustFill(page.getByLabel(/email/i), TEST_EMAIL!);
  await robustFill(page.getByLabel(/password/i).first(), TEST_PASSWORD!);
  await page
    .getByRole("tabpanel", { name: /sign in/i })
    .getByRole("button", { name: /^sign in$/i })
    .click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 30_000 });
}

test.describe("meds redesign", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
    await signInRobust(page);
  });

  test("meds page shows a single Today's doses section", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page).toHaveURL(/\/meds/);
    await expect(page.getByRole("heading", { name: /today's doses/i })).toHaveCount(1);
  });

  test("scan label action opens the scan sheet", async ({ page }) => {
    await gotoApp(page, "/meds");
    await page.getByRole("button", { name: /scan label/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar primary nav has no duplicate top-level items", async ({ page }) => {
    await gotoApp(page, "/today");
    await page.setViewportSize({ width: 1024, height: 768 });
    const nav = page.locator('nav[aria-label="Primary"]');
    await expect(nav.getByRole("link", { name: "Journal", exact: true })).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "My Body", exact: true })).toHaveCount(1);
    const topLevel = await nav.locator(":scope > *").count();
    expect(topLevel).toBeGreaterThanOrEqual(7);
    expect(topLevel).toBeLessThanOrEqual(11);
  });

  test("today panel loads dose rows or empty state after regenerate", async ({ page }) => {
    await gotoApp(page, "/meds");
    const panel = page.locator("section").filter({
      has: page.getByRole("heading", { name: /today's doses/i }),
    });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const hasDoses = await panel.locator("li").count();
    const hasEmpty = await panel.getByText(/no scheduled doses today/i).count();
    expect(hasDoses > 0 || hasEmpty > 0).toBeTruthy();
  });
});
