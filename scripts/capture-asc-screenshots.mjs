#!/usr/bin/env node
/**
 * Capture App Store Connect screenshot candidates at 1284x2778 (iPhone 6.5").
 * Requires E2E creds via Doppler: TEST_USER_EMAIL / TEST_USER_PASSWORD.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "https://www.purplelife.org";
const email = process.env.TEST_USER_EMAIL ?? process.env.E2E_TEST_USER_EMAIL;
const password =
  process.env.TEST_USER_PASSWORD ?? process.env.E2E_TEST_USER_PASSWORD;
const outDir = path.join(process.cwd(), "test-results/asc-screenshots");

if (!email || !password) {
  console.error("[asc-screenshots] Missing TEST_USER_EMAIL / TEST_USER_PASSWORD");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1284, height: 2778 },
  deviceScaleFactor: 1,
});

const shots = [
  { path: "/sign-in", file: "01-sign-in-1284x2778.png", auth: false },
  { path: "/today", file: "02-today-1284x2778.png", auth: true },
  { path: "/settings", file: "03-settings-1284x2778.png", auth: true },
  { path: "/vitals", file: "04-vitals-1284x2778.png", auth: true },
];

await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded" });
const emailField = page.getByPlaceholder(/email address/i);
const passwordField = page.getByPlaceholder(/^password$/i);
await emailField.fill(email);
await passwordField.fill(password);
await page.getByRole("button", { name: /^login now$/i }).click();
await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), {
  timeout: 45000,
});

for (const shot of shots) {
  if (!shot.auth) continue;
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outDir, shot.file),
    fullPage: false,
  });
  console.log(`[asc-screenshots] Wrote ${shot.file}`);
}

await page.goto(`${baseUrl}/sign-in`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.screenshot({
  path: path.join(outDir, shots[0].file),
  fullPage: false,
});
console.log(`[asc-screenshots] Wrote ${shots[0].file}`);

await browser.close();
console.log("[asc-screenshots] Done");
