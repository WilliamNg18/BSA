import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const source = ts.createSourceFile("pharmacy-scenario-helpers.ts",
  readFileSync(new URL("../e2e/pharmacy-scenario-helpers.ts", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function helper(name: string) {
  const declaration = source.statements.find((node): node is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(node) && node.name?.text === name);
  if (!declaration?.body) throw new Error(`Missing helper ${name}`);
  return declaration;
}

function calls(node: ts.Node): ts.CallExpression[] {
  const result: ts.CallExpression[] = [];
  function visit(child: ts.Node) {
    if (ts.isCallExpression(child)) result.push(child);
    ts.forEachChild(child, visit);
  }
  visit(node);
  return result;
}

describe("published paper-scenario harness contract (static, not browser evidence)", () => {
  it("selects the real paper scenario explicitly and checks its item identity", () => {
    const declaration = helper("choosePaperExample");
    expect(declaration.parameters[1].initializer?.getText(source)).toBe('"EX-24123"');
    const choices = calls(declaration).filter((call) => call.expression.getText(source) === "choosePharmacyRadio");
    expect(choices.map((call) => call.arguments[1].getText(source))).toEqual([
      '"Paper"',
      'caseId === "EX-24123" ? "Unreadable paper" : "Brand missing on readable paper"',
    ]);
    const identity = calls(declaration).find((call) =>
      ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "toHaveAttribute");
    expect(identity?.arguments.map((argument) => argument.getText(source))).toEqual(['"data-pharmacy-case"', "caseId"]);
  });

  it("starts B with the published factory-backed paper control and explicit Post", () => {
    const declaration = helper("startBReviewFromPharmacy");
    const choices = calls(declaration).filter((call) => call.expression.getText(source) === "choosePaperExample");
    expect(choices.map((call) => call.arguments[1].getText(source))).toEqual(['"EX-24112"']);
    const submits = calls(declaration).filter((call) =>
      ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "locator");
    expect(submits.map((call) => call.arguments[0].getText(source))).toContain("'[data-pharmacy-action=\"submit\"]'");
    expect(declaration.getText(source)).not.toMatch(/NCSO missing date|Dispenser endorsement|Send claim/);
  });

  it("does not manufacture incomplete evidence, reset state, or write through an observer", () => {
    for (const name of ["choosePharmacyRadio", "choosePaperExample", "startBReviewFromPharmacy"]) {
      const declaration = helper(name);
      const methods = calls(declaration).flatMap((call) =>
        ts.isPropertyAccessExpression(call.expression) ? [call.expression.name.text] : []);
      expect(methods).not.toEqual(expect.arrayContaining(["fill"]));
      expect(methods).not.toEqual(expect.arrayContaining(["evaluate"]));
      expect(methods).not.toEqual(expect.arrayContaining(["evaluateHandle"]));
      expect(declaration.getText(source)).not.toMatch(/resetDemo|setPharmacyDraft|useAppStore|__BSA/);
    }
  });
});
