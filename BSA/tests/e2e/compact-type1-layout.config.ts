import { defineConfig } from "@playwright/test";
import base from "../../playwright.config";

export default defineConfig({
  ...base,
  testDir: "../integration",
  testMatch: "compact-type1-layout.spec.ts",
  testIgnore: [],
});
