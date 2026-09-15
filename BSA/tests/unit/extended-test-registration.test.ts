import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it } from "vitest";

it.each([
  ["../live/recommendations.spec.ts", 5],
  ["../e2e/extended-paper.spec.ts", 2],
  ["../e2e/timed-transitions.spec.ts", 1],
  ["../e2e/recommendation-visibility.spec.ts", 1],
  ["../e2e/concrete-previews.spec.ts", 1],
  ["../integration/full-trace-timed-matrices.spec.ts", 1],
] as const)("registers %s tests at suite scope, never inside another test", (path, expected) => {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  let registrations = 0;
  function visit(node: ts.Node, testDepth = 0) {
    const registration = ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["test", "timedTest"].includes(node.expression.text);
    if (registration) {
      expect(testDepth, "A test declaration cannot execute inside another test").toBe(0);
      registrations++;
    }
    ts.forEachChild(node, (child) => visit(child, testDepth + Number(registration)));
  }
  visit(file);
  expect(registrations).toBe(expected);
});
