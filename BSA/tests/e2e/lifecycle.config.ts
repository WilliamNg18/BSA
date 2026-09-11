import { defineConfig } from "@playwright/test";
import base from "../../playwright.config";

/** Optional development-server diagnostics; production acceptance uses the main config. */
export default defineConfig({
  ...base,
  testDir: ".",
  // Vite development diagnostics do not enforce production hosting headers.
  // The main CI and production-artifact configurations retain this acceptance.
  testIgnore: "**/accessibility-final.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:4179/" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4179 --strictPort --base /",
    url: "http://127.0.0.1:4179/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});