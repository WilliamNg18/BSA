import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const directory = new URL("../e2e/", import.meta.url);
const helperText = readFileSync(new URL("operator-action-helpers.ts", directory), "utf8");

describe("operator advice locator contract (static, not browser evidence)", () => {
  it("selects the actual direct advice sibling without broadening the human decision scope", () => {
    expect(helperText).toContain('export const operatorDecision = (page: Page) => page.getByRole("region", { name: "Operator decision", exact: true });');
    expect(helperText).toContain('scope.locator(\'[data-operator-workspace] > [data-recommendation-case][data-recommendation-audience="operator"]\')');
  });

  it("does not click Apply through the retired nested human-panel locator", () => {
    const violations: string[] = [];
    for (const name of readdirSync(directory).filter((name) => name.endsWith(".ts"))) {
      const file = ts.createSourceFile(name, readFileSync(new URL(name, directory), "utf8"),
        ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "click") {
          const target = node.expression.expression;
          if (ts.isCallExpression(target) && ts.isPropertyAccessExpression(target.expression) &&
            target.expression.name.text === "getByRole" && target.arguments[0] &&
            ts.isStringLiteral(target.arguments[0]) && target.arguments[0].text === "button") {
            const options = target.arguments[1];
            const apply = options && ts.isObjectLiteralExpression(options) && options.properties.some((property) =>
              ts.isPropertyAssignment(property) && property.name.getText(file) === "name" &&
              ts.isStringLiteral(property.initializer) && property.initializer.text === "Apply suggestion");
            const receiver = target.expression.expression.getText(file);
            if (apply && receiver === "operatorDecision(page)") {
              violations.push(`${name}:${file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(file);
    }
    expect(violations).toEqual([]);
  });
});
