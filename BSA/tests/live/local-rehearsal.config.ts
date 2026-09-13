import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { checklistConfig } from "./checklist-config";
import { evidenceSettings } from "./settings";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4193);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("A valid local rehearsal port is required.");
const baseURL = `http://localhost:${port}/`;
const settings = evidenceSettings(process.env, fileURLToPath(new URL("../../../", import.meta.url)), "REHEARSAL_OUTPUT_DIR");
const checklist = checklistConfig({ ...settings, baseURL });

export default defineConfig({
  ...checklist,
  metadata: { ...checklist.metadata, kind: "local rehearsal, not hosted acceptance" },
  projects: [{ name: "local-rehearsal-chromium" }],
  webServer: {
    command: "node scripts/serve-production.mjs",
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    env: { PLAYWRIGHT_PORT: String(port) }, url: baseURL, reuseExistingServer: false, timeout: 120_000,
  },
});
