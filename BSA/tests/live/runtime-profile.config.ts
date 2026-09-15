import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import rehearsal from "./local-rehearsal.config";
import { RUNTIME_PROFILE_KIND } from "../support/chromium-runtime-profile";

if (!rehearsal.outputDir) throw new Error("Runtime profiling requires the strict local rehearsal output directory.");

export default defineConfig({
  ...rehearsal,
  testDir: fileURLToPath(new URL("../integration", import.meta.url)),
  testMatch: "full-trace-timed-matrices.spec.ts",
  metadata: { ...rehearsal.metadata, kind: RUNTIME_PROFILE_KIND, runtimeProfile: true, routeDiagnostics: false },
  grep: /37 Actual cross-side transitions.*1280 px, Agent On/,
  reporter: [["list"], ["json", { outputFile: resolve(rehearsal.outputDir, "..", "runtime-profile-results.json") }]],
  use: { ...rehearsal.use, trace: "on" },
});
