import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it } from "vitest";
import { PLAYABLE_CYCLES } from "../support/desktop-matrix";
import { RUNTIME_PROFILE_KIND, runtimeProfileEnabled } from "../support/chromium-runtime-profile";

const specSource = readFileSync(new URL("../integration/first-a-runtime-profile.spec.ts", import.meta.url), "utf8");
const configSource = readFileSync(new URL("../live/first-a-runtime-profile.config.ts", import.meta.url), "utf8");

it("runs the unchanged helper exactly once with the original first-case preconditions", () => {
  const file = ts.createSourceFile("first-a-runtime-profile.spec.ts", specSource, ts.ScriptTarget.Latest, true);
  const journeys: ts.CallExpression[] = [];
  const tests: ts.CallExpression[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      if (node.expression.getText(file) === "runTimedCaseJourney") journeys.push(node);
      if (node.expression.getText(file) === "test") tests.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  expect(tests).toHaveLength(1);
  expect(journeys).toHaveLength(1);
  expect(journeys[0].arguments.map((argument) => argument.getText(file)))
    .toEqual(["page", "info", "PLAYABLE_CYCLES[0]", "true", '"Both"']);
  expect(specSource).toContain('from "../live/fixtures"');
  expect(specSource).toContain("setViewportSize({ width: 1280, height: 1000 })");
  expect(specSource).not.toMatch(/page\.(?:goto|reload|goBack|goForward|evaluate|clock)\b/);
});

it("keeps A and Both first in the original matrix ordering", () => {
  expect(PLAYABLE_CYCLES[0]).toMatchObject({ id: "EX-24107", kind: "complete", channel: "eps" });
  const matrix = readFileSync(new URL("../live/recommendations.spec.ts", import.meta.url), "utf8");
  expect(matrix).toContain("for (const item of PLAYABLE_CYCLES) for (const perspective of REQUIRED_PERSPECTIVES)");
  const paper = readFileSync(new URL("../e2e/extended-paper-helpers.ts", import.meta.url), "utf8");
  const file = ts.createSourceFile("extended-paper-helpers.ts", paper, ts.ScriptTarget.Latest, true);
  let first: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === "REQUIRED_PERSPECTIVES" && node.initializer) {
      const initializer = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (ts.isArrayLiteralExpression(initializer) && ts.isStringLiteral(initializer.elements[0])) {
        first = initializer.elements[0].text;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  expect(first).toBe("Both");
});

it("uses a separate first-A selection while inheriting the reviewed profile and inactive defaults", () => {
  expect(configSource).toContain('from "./runtime-profile.config"');
  expect(configSource).toContain('testMatch: "first-a-runtime-profile.spec.ts"');
  expect(configSource).toContain("grep: undefined");
  expect(configSource).toContain("First A only");
  expect(configSource).toContain("not a complete matrix, 75-check run or acceptance");
  expect(configSource).not.toContain("PROFILE_LIMITS");
  expect(runtimeProfileEnabled({}, undefined)).toBe(false);
  expect(runtimeProfileEnabled({ runtimeProfile: true, kind: RUNTIME_PROFILE_KIND }, "http://localhost:4336/")).toBe(true);
  expect(() => runtimeProfileEnabled({ runtimeProfile: true, kind: RUNTIME_PROFILE_KIND, routeDiagnostics: true }, "http://localhost:4336/")).toThrow();
});
