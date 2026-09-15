import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";
import rehearsal from "./local-rehearsal.config";
import { ROUTE_DIAGNOSTIC_KIND } from "../support/route-commit-diagnostics";

if (!rehearsal.outputDir) throw new Error("Route diagnostics require the strict local rehearsal output directory.");

export default defineConfig({
  ...rehearsal,
  metadata: { ...rehearsal.metadata, kind: ROUTE_DIAGNOSTIC_KIND, routeDiagnostics: true },
  grep: /37 Actual cross-side transitions.*Agent On/,
  reporter: [["list"], ["json", { outputFile: resolve(rehearsal.outputDir, "..", "route-diagnostic-results.json") }]],
  use: { ...rehearsal.use, trace: "on" },
});
