import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import production from "../../playwright.config";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

// Header-enforced diagnostics of an already emitted artifact, without rebuilding.
// This does not replace the default build-and-test gate.
export default defineConfig({
  ...production,
  testDir: fileURLToPath(new URL(".", import.meta.url)),
  retries: 0,
  webServer: {
    command: "node scripts/serve-production.mjs",
    env: { PLAYWRIGHT_PORT: String(port) },
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});