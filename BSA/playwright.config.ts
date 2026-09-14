import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = `http://localhost:${port}/`;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/one-state*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
  webServer: {
    command: "npm run build && node scripts/serve-production.mjs",
    env: { PLAYWRIGHT_PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});