import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import base from "../../playwright.config";

export default defineConfig({
  ...base,
  testDir: fileURLToPath(new URL("../integration", import.meta.url)),
  testMatch: "recommendation-smoke.spec.ts",
  testIgnore: [],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  webServer: {
    ...base.webServer,
    command: "npm run build && node scripts/serve-production.mjs",
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
  },
});
