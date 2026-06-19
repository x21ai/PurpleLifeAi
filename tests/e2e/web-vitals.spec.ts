import { test, expect, type Page } from "@playwright/test";
import { hasTestCreds, gotoApp, signIn } from "./helpers";

/**
 * Core Web Vitals budget gate. Collects lab metrics per key route using
 * PerformanceObserver (LCP, CLS) plus a long-task total as a Total Blocking
 * Time / INP proxy, and asserts budgets. Runs on a single deterministic
 * viewport project to keep numbers comparable run to run.
 *
 * Budgets are intentionally lab-lenient (measured against a real network, not
 * a throttled lab) and tunable via env so CI can tighten them over time:
 *   CWV_LCP_MS (default 4000), CWV_CLS (default 0.15), CWV_TBT_MS (default 800)
 */

const LCP_BUDGET_MS = Number(process.env.CWV_LCP_MS ?? 4000);
const CLS_BUDGET = Number(process.env.CWV_CLS ?? 0.15);
const TBT_BUDGET_MS = Number(process.env.CWV_TBT_MS ?? 800);

type Vitals = { lcp: number; cls: number; tbt: number };

async function collectVitals(page: Page): Promise<Vitals> {
  // Install observers as early as possible after navigation settles, then
  // give the page a window to paint and shift before reading the values.
  return page.evaluate(async () => {
    const result = { lcp: 0, cls: 0, tbt: 0 };

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
        startTime: number;
      };
      if (last) result.lcp = last.renderTime || last.loadTime || last.startTime;
    });
    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      /* unsupported */
    }

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<
        PerformanceEntry & { value: number; hadRecentInput: boolean }
      >) {
        if (!entry.hadRecentInput) result.cls += entry.value;
      }
    });
    try {
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      /* unsupported */
    }

    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // TBT contribution is the portion of each long task beyond 50ms.
        result.tbt += Math.max(0, entry.duration - 50);
      }
    });
    try {
      longTaskObserver.observe({ type: "longtask", buffered: true });
    } catch {
      /* unsupported (webkit) */
    }

    await new Promise((r) => setTimeout(r, 2500));
    lcpObserver.disconnect();
    clsObserver.disconnect();
    longTaskObserver.disconnect();
    return result;
  });
}

function assertBudgets(path: string, v: Vitals) {
  expect(v.lcp, `${path} LCP ${Math.round(v.lcp)}ms over ${LCP_BUDGET_MS}ms`).toBeLessThanOrEqual(
    LCP_BUDGET_MS,
  );
  expect(v.cls, `${path} CLS ${v.cls.toFixed(3)} over ${CLS_BUDGET}`).toBeLessThanOrEqual(
    CLS_BUDGET,
  );
  // longtask is Chromium-only; only enforce when we actually observed tasks.
  if (v.tbt > 0) {
    expect(v.tbt, `${path} TBT ${Math.round(v.tbt)}ms over ${TBT_BUDGET_MS}ms`).toBeLessThanOrEqual(
      TBT_BUDGET_MS,
    );
  }
}

test.describe("core web vitals: public", () => {
  test("/ landing within budgets", async ({ page }) => {
    await gotoApp(page, "/");
    await page.waitForLoadState("networkidle").catch(() => {});
    const v = await collectVitals(page);
    console.log(`CWV / => LCP=${Math.round(v.lcp)}ms CLS=${v.cls.toFixed(3)} TBT=${Math.round(v.tbt)}ms`);
    assertBudgets("/", v);
  });
});

test.describe("core web vitals: app", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCreds(), "TEST_USER_EMAIL/PASSWORD not set");
    await signIn(page);
  });

  for (const path of ["/today", "/meds", "/biometrics", "/reports", "/journal"] as const) {
    test(`${path} within budgets`, async ({ page }) => {
      await gotoApp(page, path);
      await page.waitForLoadState("networkidle").catch(() => {});
      const v = await collectVitals(page);
      console.log(
        `CWV ${path} => LCP=${Math.round(v.lcp)}ms CLS=${v.cls.toFixed(3)} TBT=${Math.round(v.tbt)}ms`,
      );
      assertBudgets(path, v);
    });
  }
});
