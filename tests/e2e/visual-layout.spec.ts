import { test, expect, type Page } from "@playwright/test";
import { hasTestCreds, gotoApp, signIn } from "./helpers";

/**
 * Visual layout guard. Verifies bottom-sheet content stays in a centered,
 * width-capped column on desktop (no full-bleed drift) and captures full-page
 * screenshots per viewport for human review under test-results/visual/.
 */

function viewportTag(page: Page): string {
  const vp = page.viewportSize();
  return vp ? `${vp.width}x${vp.height}` : "unknown";
}

async function shot(page: Page, name: string) {
  const tag = viewportTag(page);
  await page.screenshot({
    path: `test-results/visual/${tag}-${name}.png`,
    fullPage: true,
  });
}

test.describe("visual layout", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
    await signIn(page);
  });

  test("add medication sheet stays a centered narrow column", async ({ page }) => {
    await gotoApp(page, "/meds");
    await page
      .getByRole("button", { name: /add a medication/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });

    const column = page.getByTestId("med-form-column");
    await expect(column).toBeVisible();
    const box = await column.boundingBox();
    expect(box).not.toBeNull();

    const vp = page.viewportSize();
    if (vp && vp.width >= 1024) {
      // max-w-xl is 36rem (576px); allow a little slack for padding/scrollbars.
      expect(box!.width).toBeLessThanOrEqual(640);
      // And it must not be stretching to the full viewport.
      expect(box!.width).toBeLessThan(vp.width - 100);
    }
    await shot(page, "add-medication-sheet");
  });

  test("capture full-page screenshots of key pages", async ({ page }) => {
    for (const path of ["/meds", "/biometrics", "/today"] as const) {
      await gotoApp(page, path);
      await expect(page.getByText(/^Loading/))
        .toHaveCount(0, { timeout: 15_000 })
        .catch(() => {});
      await page.waitForTimeout(800);
      await shot(page, path.replace(/\//g, "") || "home");
    }
  });

  test("light mode applies to the Account sheet page", async ({ page }) => {
    // Force Light, then load Account (a forced-dark canvas before the fix).
    await gotoApp(page, "/today");
    await page.evaluate(() => localStorage.setItem("purple-theme", "light"));
    await gotoApp(page, "/account");
    await page.waitForTimeout(800);
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    const canvas = page.locator(".sheet-canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    // The canvas background must be light (high luminance) in light mode.
    const lum = await canvas.evaluate((el) => {
      const m = getComputedStyle(el).backgroundColor.match(/\d+/g);
      if (!m) return 0;
      const [r, g, b] = m.map(Number);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    });
    expect(lum).toBeGreaterThan(160);
    await shot(page, "account-light");
  });
});
