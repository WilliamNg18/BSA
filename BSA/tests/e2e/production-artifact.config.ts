import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import production from "../../playwright.config";

// Diagnostic verification of an already emitted production artifact. This does
// not replace the default build-and-test gate. Size remains advisory.
export default defineConfig({
  ...production,
  testDir: fileURLToPath(new URL(".", import.meta.url)),
  retries: 0,
  webServer: {
    command: "npm run preview -- --host localhost --port 4173 --strictPort",
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    url: "http://localhost:4173/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});