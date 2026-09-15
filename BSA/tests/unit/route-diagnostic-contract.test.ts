import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { routeDiagnosticsEnabled, ROUTE_DIAGNOSTIC_KIND } from "../support/route-commit-diagnostics";
import { extendedRequirementTitle, LIVE_CHECKLIST } from "../live/inventory";

it.each([{}, { routeDiagnostics: false }, { routeDiagnostics: "true" }])("leaves standard runs inactive for metadata %j", (metadata) => {
  expect(routeDiagnosticsEnabled(metadata, undefined)).toBe(false);
  expect(routeDiagnosticsEnabled(metadata, "https://example.test/")).toBe(false);
});

it.each(["http://localhost:4336/", "http://127.0.0.1:4336/"])("permits explicitly labelled local diagnostics at %s", (url) => {
  expect(routeDiagnosticsEnabled({ routeDiagnostics: true, kind: ROUTE_DIAGNOSTIC_KIND }, url)).toBe(true);
});

it.each(["https://localhost:4336/", "http://example.test/", undefined])("rejects diagnostic destination %s", (url) => {
  expect(() => routeDiagnosticsEnabled({ routeDiagnostics: true, kind: ROUTE_DIAGNOSTIC_KIND }, url)).toThrow();
});

it("rejects an observer flag on an acceptance-labelled configuration", () => {
  expect(() => routeDiagnosticsEnabled({ routeDiagnostics: true, kind: "local rehearsal" }, "http://localhost:4336/"))
    .toThrow("explicitly labelled diagnostic");
});

it("selects exactly the two existing complete On matrices", () => {
  const source = readFileSync(new URL("../live/route-diagnostic.config.ts", import.meta.url), "utf8");
  const selection = source.match(/grep:\s*\/([^/\n]+)\//);
  expect(selection).not.toBeNull();
  if (!selection) throw new Error("The diagnostic configuration must declare its bounded matrix selection.");
  const pattern = new RegExp(selection[1]);
  expect(LIVE_CHECKLIST.filter((name) => pattern.test(name))).toEqual([
    extendedRequirementTitle("transition", 1280, true),
    extendedRequirementTitle("transition", 1440, true),
  ]);
});
