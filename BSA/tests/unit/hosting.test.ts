import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const config = JSON.parse(readFileSync(root("staticwebapp.config.json"), "utf8"));

describe("root Static Web Apps hosting contract", () => {
  it("falls back for client navigation without swallowing assets in navigationFallback", () => {
    expect(config.navigationFallback.rewrite).toBe("/index.html");
    expect(config.navigationFallback.exclude).toEqual(expect.arrayContaining(["/assets/*", "/images/*", "/fonts/*"]));
    expect(config.navigationFallback.exclude.join(" ")).toContain("json");
    expect(config.responseOverrides["404"]).toEqual({ rewrite: "/index.html", statusCode: 200 });
  });

  it("uses only local content and immutable fingerprinted assets", () => {
    expect(config.globalHeaders["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(config.globalHeaders["Content-Security-Policy"]).not.toMatch(/unsafe-inline|unsafe-eval|https?:|\*/);
    expect(config.globalHeaders).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
    });
    expect(config.routes).toContainEqual({ route: "/assets/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
  });

  it("has a single hosting workflow and template", () => {
    const workflow = readFileSync(root(".github/workflows/azure-static-web-apps.yml"), "utf8");
    expect(workflow).toContain("app_location: BSA/dist");
    expect(workflow).toContain("AZURE_STATIC_WEB_APPS_API_TOKEN");
    expect(workflow).toContain("action: close");
    expect(readFileSync(root("infra/staticwebapp.bicep"), "utf8")).toContain("location: 'westeurope'");
    expect(existsSync(root(".github/workflows/deploy.yml"))).toBe(false);
    expect(existsSync(root("BSA/azure.yaml"))).toBe(false);
  });
});
