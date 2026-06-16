import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const isRemoteE2E = !!process.env.E2E_BASE_URL && !BASE_URL.includes("localhost");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: isRemoteE2E ? 1 : undefined,
  retries: process.env.CI || isRemoteE2E ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: isRemoteE2E ? 60_000 : 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    navigationTimeout: isRemoteE2E ? 60_000 : 30_000,
  },
  projects: [
    { name: "mobile-375", use: { ...devices["iPhone 13"] } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "tablet-1023", use: { viewport: { width: 1023, height: 768 } } },
    { name: "desktop-1024", use: { viewport: { width: 1024, height: 768 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});