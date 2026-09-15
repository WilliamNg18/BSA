import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import profile from "./runtime-profile.config";

if (!profile.outputDir) throw new Error("First-A profiling requires the strict local profiling output directory.");

export default defineConfig({
  ...profile,
  testDir: fileURLToPath(new URL("../integration", import.meta.url)),
  testMatch: "first-a-runtime-profile.spec.ts",
  grep: undefined,
  metadata: {
    ...profile.metadata,
    diagnosticScope: "First A only, 1280 On Both; not a complete matrix, 75-check run or acceptance.",
  },
  reporter: [["list"], ["json", { outputFile: resolve(profile.outputDir, "..", "first-a-runtime-profile-results.json") }]],
});
