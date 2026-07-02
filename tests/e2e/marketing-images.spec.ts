import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

// Routes that import calm-images modules (see src/routes/*.tsx). Pricing has no
// hero imagery; /community is behind the community platform flag in e2e.
const MARKETING_ROUTES = [
  "/",
  "/features",
  "/about",
  "/contact",
  "/trust",
  "/sign-in",
] as const;

async function assertImagesLoaded(page: import("@playwright/test").Page, route: string) {
  const imgs = page.locator("picture img, main img, section img, header img");
  const count = await imgs.count();
  expect(count, `expected at least one image on ${route}`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const img = imgs.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible({ timeout: 15_000 });
    await img.evaluate((el) => {
      const node = el as HTMLImageElement;
      if (node.complete && node.naturalWidth > 0) return;
      return new Promise<void>((resolve, reject) => {
        node.addEventListener("load", () => resolve(), { once: true });
        node.addEventListener("error", () => reject(new Error("image error")), { once: true });
      });
    });
    const src = await img.getAttribute("src");
    expect(src ?? "", `Lovable CDN URL on ${route}`).not.toContain("/__l5e/");
    const ok = await img.evaluate((el) => {
      const node = el as HTMLImageElement;
      return node.naturalWidth > 0 && node.naturalHeight > 0;
    });
    expect(ok, `broken image on ${route}: ${src ?? "(no src)"}`).toBe(true);
  }
}

for (const route of MARKETING_ROUTES) {
  test(`marketing images load on ${route}`, async ({ page }) => {
    await gotoApp(page, route);
    await assertImagesLoaded(page, route);
  });
}
