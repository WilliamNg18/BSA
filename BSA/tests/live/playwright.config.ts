import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { liveSettings } from "./settings";

const settings = liveSettings(process.env, fileURLToPath(new URL("../../../", import.meta.url)));

export default defineConfig({
  testDir: ".",
  testMatch: ["checklist.spec.ts", "perspective.spec.ts", "header-agent.spec.ts", "task30.spec.ts", "continuous-cycle.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  outputDir: join(settings.output, "test-results"),
  reporter: [["list"], ["./checklist-reporter.ts", {
    outputFile: join(settings.output, "checklist.json"),
    baseURL: settings.baseURL,
    expectedCommit: settings.expectedCommit,
  }]],
  metadata: { baseURL: settings.baseURL, expectedCommit: settings.expectedCommit },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: settings.baseURL,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "live-chromium" }],
  webServer: undefined,
});
