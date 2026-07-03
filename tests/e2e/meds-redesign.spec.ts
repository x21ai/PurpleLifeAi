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
  await robustFill(page.getByPlaceholder(/email address/i), TEST_EMAIL!);
  await robustFill(page.getByPlaceholder(/^password$/i), TEST_PASSWORD!);
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

  test("today panel shows explicit calendar date", async ({ page }) => {
    await gotoApp(page, "/meds");
    const panel = page.locator("#today-doses");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    // The date label (with a 4-digit year) shows either in the day-nav row
    // (span) or as a plain paragraph; assert it is present somewhere in the card.
    await expect(panel.getByText(/\d{4}/).first()).toBeVisible();
  });

  test("med row link navigates to medication detail", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const rowLink = page.getByTestId("med-row-link").first();
    const count = await rowLink.count();
    test.skip(count === 0, "no medications in library");
    await rowLink.click();
    await page.waitForURL(/\/meds\/[0-9a-f-]+/i, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/dose history/i)).toBeVisible();
  });

  test("no duplicate dose rows for the same medication at the same time", async ({ page }) => {
    await gotoApp(page, "/meds");
    const panel = page.locator("#today-doses");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const rows = panel.locator("li");
    const n = await rows.count();
    if (n === 0) return;
    const keys = new Set<string>();
    for (let i = 0; i < n; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, " ").trim();
      if (keys.has(text)) {
        throw new Error(`Duplicate dose row: ${text}`);
      }
      keys.add(text);
    }
  });

  test("meds header exposes icon actions with accessible names", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /add a medication/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /scan label/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^voice$/i }).first()).toBeVisible();
  });

  test("more insights collapsible is gone (adherence is inline)", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText(/more insights/i)).toHaveCount(0);
  });

  test("day navigation steps back a day and cannot go past today", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const panel = page.locator("#today-doses");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    const datePicker = panel.getByLabel(/pick a date/i);
    if ((await datePicker.count()) === 0) {
      test.skip(true, "no library, day nav not shown");
    }
    const todayVal = await datePicker.inputValue();
    await panel.getByRole("button", { name: /previous day/i }).click();
    await expect(datePicker).not.toHaveValue(todayVal);
    // Next day is disabled once back at today.
    await panel.getByRole("button", { name: /next day/i }).click();
    await expect(datePicker).toHaveValue(todayVal);
    await expect(panel.getByRole("button", { name: /next day/i })).toBeDisabled();
  });

  test("reminder banner is not inside the Today's doses card", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const panel = page.locator("#today-doses");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText(/turn on reminders/i)).toHaveCount(0);
  });

  test("add medication form exposes a Start date field", async ({ page }) => {
    await gotoApp(page, "/meds");
    await page
      .getByRole("button", { name: /add a medication/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("dialog").getByText("Duration", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("Start date", { exact: true })).toBeVisible();
  });

  test("medication list shows the manage hint", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const rowCount = await page.getByTestId("med-row-link").count();
    test.skip(rowCount === 0, "no medications in library");
    await expect(page.getByText(/tap a medication to see its dose history/i)).toBeVisible();
  });

  test("medication detail reads as a history and settings hub", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const rowLink = page.getByTestId("med-row-link").first();
    test.skip((await rowLink.count()) === 0, "no medications in library");
    await rowLink.click();
    await page.waitForURL(/\/meds\/[0-9a-f-]+/i, { timeout: 15_000 });
    await expect(page.getByText("History and settings", { exact: true })).toBeVisible();
    await expect(page.getByText(/tap a dose to correct it/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^edit$/i })).toBeVisible();
  });

  test("dose history page renders and is linked from the toolbar", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("link", { name: /dose history/i }).first()).toBeVisible();
    await gotoApp(page, "/meds/history");
    await expect(page.getByRole("heading", { name: /dose history/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("medication library has an 'All medications' heading", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const rowCount = await page.getByTestId("med-row-link").count();
    test.skip(rowCount === 0, "no medications in library");
    await expect(page.getByText("All medications", { exact: true })).toBeVisible();
  });

  test("today page shows a unified signals section", async ({ page }) => {
    await gotoApp(page, "/today");
    await expect(page.getByText("Your signals", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("actions toolbar sits above the Today's doses card", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const addBtn = page.getByRole("button", { name: /add a medication/i }).first();
    const heading = page.getByRole("heading", { name: /today's doses/i });
    await expect(addBtn).toBeVisible();
    await expect(heading).toBeVisible();
    const addBox = await addBtn.boundingBox();
    const headBox = await heading.boundingBox();
    expect(addBox).not.toBeNull();
    expect(headBox).not.toBeNull();
    // Toolbar is above the Today's doses heading.
    expect(addBox!.y).toBeLessThan(headBox!.y);
  });

  test("a past dose can be opened for editing", async ({ page }) => {
    await gotoApp(page, "/meds");
    await expect(page.getByText(/^Loading/)).toHaveCount(0, { timeout: 15_000 });
    const rowLink = page.getByTestId("med-row-link").first();
    test.skip((await rowLink.count()) === 0, "no medications in library");
    await rowLink.click();
    await page.waitForURL(/\/meds\/[0-9a-f-]+/i, { timeout: 15_000 });
    // Add a past dose is always available on the detail page.
    await expect(page.getByRole("button", { name: /add a past dose/i })).toBeVisible();
    await page.getByRole("button", { name: /add a past dose/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("dialog").getByText(/^Status$/)).toBeVisible();
  });

  test("selecting a med enriches dosage form from the drug database", async ({ page }) => {
    await gotoApp(page, "/meds");
    await page
      .getByRole("button", { name: /add a medication/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    const search = page.getByPlaceholder(/search medications/i);
    await search.fill("metoprolol");
    const result = page
      .getByRole("option")
      .filter({ hasText: /metoprolol/i })
      .first();
    await expect(result).toBeVisible({ timeout: 5_000 });
    await result.click();
    // openFDA/RxNorm should fill a dosage form; allow time and skip if the
    // external API is unreachable from CI.
    await page.waitForTimeout(5_000);
    const formTrigger = page.getByRole("combobox").first();
    const text = ((await formTrigger.textContent()) ?? "").toLowerCase();
    test.skip(
      text.includes("select form") || text.trim() === "",
      "drug DB returned no form (offline/CI)",
    );
    expect(text).toMatch(/tablet|capsule|pill|liquid|injection|drops|patch|inhaler|powder|gummy/);
  });

  test("add medication form shows grouped sections and search", async ({ page }) => {
    await gotoApp(page, "/meds");
    await page
      .getByRole("button", { name: /add a medication/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/search medications/i)).toBeVisible();
    await expect(page.getByText("Details", { exact: true })).toBeVisible();
    await expect(page.getByText("Schedule", { exact: true })).toBeVisible();
  });

  test("search selects Crestor and prefills strength", async ({ page }) => {
    await gotoApp(page, "/meds");
    await page
      .getByRole("button", { name: /add a medication/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    const search = page.getByPlaceholder(/search medications/i);
    await search.fill("crest");
    const result = page
      .getByRole("option")
      .filter({ hasText: /crestor/i })
      .first();
    await expect(result).toBeVisible({ timeout: 5_000 });
    await result.click();
    await expect(page.getByRole("spinbutton").first()).toHaveValue("5");
  });
});

test.describe("biometrics attention", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
    await signInRobust(page);
  });

  test("attention metrics render under the alert banner", async ({ page }) => {
    await gotoApp(page, "/biometrics");
    await page.setViewportSize({ width: 1024, height: 768 });
    const banner = page.getByText(/signal(s)? need a look/i);
    const bannerVisible = await banner.isVisible().catch(() => false);
    test.skip(!bannerVisible, "no attention signals for this user");
    const needsSection = page.getByText("Needs a look", { exact: true });
    await expect(needsSection).toBeVisible();
    await expect(page.locator("[id^='metric-']").first()).toBeVisible();
  });
});
