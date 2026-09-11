import { defineConfig } from "@playwright/test";
import base from "../../playwright.config";

/** Explicit development-server verification when the production budget blocks build. */
export default defineConfig({
  ...base,
  testDir: ".",
  use: { ...base.use, baseURL: "http://127.0.0.1:4179/BSA/" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4179 --strictPort --base /BSA/",
    url: "http://127.0.0.1:4179/BSA/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});