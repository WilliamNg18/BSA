import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { liveSettings } from "./settings";

export function checklistConfig(settings: ReturnType<typeof liveSettings>) {
  return defineConfig({
    testDir: fileURLToPath(new URL(".", import.meta.url)),
    testMatch: ["checklist.spec.ts", "header-agent.spec.ts", "desktop-demo.spec.ts", "four-case-cycle.spec.ts"],
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 120_000,
    outputDir: join(settings.output, "test-results"),
    reporter: [["list"], [fileURLToPath(new URL("./checklist-reporter.ts", import.meta.url)), {
      outputFile: join(settings.output, "checklist.json"), baseURL: settings.baseURL, expectedCommit: settings.expectedCommit,
    }]],
    metadata: { baseURL: settings.baseURL, expectedCommit: settings.expectedCommit },
    use: {
      ...devices["Desktop Chrome"], baseURL: settings.baseURL, viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce", trace: "retain-on-failure", screenshot: "off",
    },
    projects: [{ name: "live-chromium" }],
    webServer: undefined,
  });
}
