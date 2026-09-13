import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";
import production from "../../playwright.config";
import { instrumentedDirectory } from "./one-state-artifact.mjs";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4206);
const baseURL = `http://localhost:${port}/`;

export default defineConfig({
  ...production,
  testDir: fileURLToPath(new URL(".", import.meta.url)),
  testMatch: "one-state.spec.ts",
  testIgnore: [],
  timeout: 120_000,
  retries: 0,
  outputDir: fileURLToPath(new URL("../../test-results/one-state", import.meta.url)),
  use: { ...production.use, baseURL },
  webServer: {
    command: `node tests/e2e/one-state-artifact.mjs && node "${join(instrumentedDirectory, "server.mjs")}"`,
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    env: { PLAYWRIGHT_PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
