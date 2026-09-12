import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import production from "../../playwright.config";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4183);
const baseURL = `http://localhost:${port}/`;

export default defineConfig({
  ...production,
  testDir: fileURLToPath(new URL(".", import.meta.url)),
  testMatch: "accessibility-final.spec.ts",
  timeout: 60_000,
  workers: 2,
  outputDir: "../../test-results/accessibility-final",
  use: { ...production.use, baseURL },
  webServer: {
    command: "npm run build && node scripts/serve-production.mjs",
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
