import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import production from "../../playwright.config";

// Diagnostic verification of an already emitted production artifact. This does
// not replace the default build-and-test gate or waive its runtime budget.
export default defineConfig({
  ...production,
  testDir: fileURLToPath(new URL(".", import.meta.url)),
  retries: 0,
  webServer: {
    command: "npm run preview -- --host localhost --port 4173 --strictPort",
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    env: { VITE_BASE: "/BSA/" },
    url: "http://localhost:4173/BSA/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});