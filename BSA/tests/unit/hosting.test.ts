import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const config = JSON.parse(readFileSync(root("hosting.config.json"), "utf8"));

describe("portable App Service hosting contract", () => {
  it("keeps client navigation separate from missing assets", () => {
    expect(config.spaFallback).toBe("/index.html");
    expect(config.assetPrefixes).toEqual(["/assets/", "/images/", "/fonts/"]);
    expect(existsSync(root("staticwebapp.config.json"))).toBe(false);
  });

  it("preserves the exact self-only policy and immutable assets", () => {
    expect(config.globalHeaders["Content-Security-Policy"]).toBe("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    expect(config.globalHeaders).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
    });
    expect(config.immutableAssetPrefix).toBe("/assets/");
  });

  it("uses main-only OIDC deployment without publish profiles or PR slots", () => {
    const workflow = readFileSync(root(".github/workflows/deploy-appservice.yml"), "utf8");
    for (const value of ["workflow_dispatch:", "branches: [main]", "id-token: write", "azure/login@v2",
      'node-version: "20"', "az webapp deploy", "working-directory: BSA/dist",
      "verify-deployment.mjs", 'zip -qr "$RUNNER_TEMP/site.zip" .']) expect(workflow).toContain(value);
    expect(workflow).not.toMatch(/pull_request:|publish-profile|AZURE_STATIC_WEB_APPS_API_TOKEN|secrets\./);
    expect(existsSync(root(".github/workflows/azure-static-web-apps.yml"))).toBe(false);
    expect(existsSync(root("infra/alternatives/staticwebapp.bicep"))).toBe(true);
    expect(existsSync(root("BSA/azure.yaml"))).toBe(false);
  });

  it("recreates the actual F1 runtime and keeps optional RBAC off by default", () => {
    const template = readFileSync(root("infra/appservice.bicep"), "utf8");
    for (const value of ["'swedencentral'", "'F1'", "'NODE|24-lts'", "alwaysOn: false",
      "httpsOnly: true", "provisionDeploymentIdentity bool = false",
      "pm2 start /home/site/wwwroot/server.mjs --no-daemon",
      "SCM_DO_BUILD_DURING_DEPLOYMENT", "WEBSITE_RUN_FROM_PACKAGE"]) expect(template).toContain(value);
    expect(template).not.toContain("Microsoft.Web/sites/slots");
  });

  it("emits a self-contained server, provider-neutral policy and Git provenance", () => {
    const vite = readFileSync(root("BSA/vite.config.ts"), "utf8");
    for (const file of ["server.mjs", "hosting.config.json", "build-info.json"]) expect(vite).toContain(`fileName: "${file}"`);
    expect(vite).toContain('["rev-parse", "HEAD"]');
    expect(vite).toContain('["status", "--porcelain"]');
    const server = readFileSync(root("BSA/scripts/static-server.mjs"), "utf8");
    expect([...server.matchAll(/from "([^"]+)"/g)].map((match) => match[1]).every((module) => module.startsWith("node:"))).toBe(true);
  });
});
