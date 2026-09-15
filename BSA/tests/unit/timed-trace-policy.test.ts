import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it, vi } from "vitest";
import { collectTimedFailureArtifacts, THIN_TIMED_TRACE, TIMED_TRACE_LOSSES, verifyResolvedTracePolicy } from "../support/timed-trace-policy";

const originalCallbackHash = "1fe7771544abc7efec19aa4fd393c239a92009905e3037f06ed73c4d270e60c5";

function matrixCallbackTokenHash(path: string, text: string) {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const bodies: ts.ConciseBody[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ["test", "timedTest"].includes(node.expression.getText(file))
      && (path.includes("timed-transitions") || node.arguments[0]?.getText(file).includes('"transition"'))) {
      const callback = node.arguments[node.arguments.length - 1];
      if (ts.isArrowFunction(callback)) bodies.push(callback.body);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  expect(bodies, path).toHaveLength(1);
  const tokens: [number, string][] = [];
  function visitTokens(node: ts.Node) {
    const children = node.getChildren(file);
    if (children.length) children.forEach(visitTokens);
    else if (node.kind <= ts.SyntaxKind.LastToken) tokens.push([node.kind, node.getText(file)]);
  }
  visitTokens(bodies[0]);
  return createHash("sha256").update(JSON.stringify(tokens)).digest("hex");
}

it("requires the exact resolved thin policy without dropping sources or attachments", () => {
  expect(THIN_TIMED_TRACE).toEqual({
    mode: "retain-on-failure", snapshots: false, screenshots: false, sources: true, attachments: true,
  });
  expect(Object.isFrozen(THIN_TIMED_TRACE)).toBe(true);
  expect(verifyResolvedTracePolicy(THIN_TIMED_TRACE, "thin-timed")).toEqual(THIN_TIMED_TRACE);
  for (const option of [
    "on", "off", "retain-on-failure",
    { ...THIN_TIMED_TRACE, sources: false },
    { ...THIN_TIMED_TRACE, attachments: false },
    { ...THIN_TIMED_TRACE, snapshots: true },
    { ...THIN_TIMED_TRACE, screenshots: true },
    { ...THIN_TIMED_TRACE, live: true },
  ]) expect(() => verifyResolvedTracePolicy(option, "thin-timed")).toThrow();
});

it("requires full tracing for diagnostic base tests", () => {
  expect(verifyResolvedTracePolicy("on", "full-diagnostic")).toEqual({
    mode: "on", snapshots: true, screenshots: true, sources: true, attachments: true,
  });
  expect(() => verifyResolvedTracePolicy(THIN_TIMED_TRACE, "full-diagnostic")).toThrow();
  expect(() => verifyResolvedTracePolicy({ mode: "on", snapshots: { dom: false } }, "full-diagnostic")).toThrow();
});

it("retains independent failure HTML and ARIA artifacts", async () => {
  const attach = vi.fn(async (_name: string, _body: string, _type: string) => { void [_name, _body, _type]; });
  await collectTimedFailureArtifacts({
    html: async () => "<main>Actual failed state</main>",
    aria: async () => '- main: "Actual failed state"',
  }, attach);
  expect(attach.mock.calls).toEqual(expect.arrayContaining([
    ["timed-failure-html", "<main>Actual failed state</main>", "text/html"],
    ["timed-failure-aria", '- main: "Actual failed state"', "text/plain"],
  ]));
});

it("surfaces artifact failure without preventing the other artifact from being retained", async () => {
  const failure = new Error("HTML unavailable");
  const attach = vi.fn(async (_name: string, _body: string, _type: string) => { void [_name, _body, _type]; });
  await expect(collectTimedFailureArtifacts({
    html: async () => { throw failure; },
    aria: async () => "- main",
  }, attach)).rejects.toBe(failure);
  expect(attach).toHaveBeenCalledExactlyOnceWith("timed-failure-aria", "- main", "text/plain");
});

it("keeps original matrix callback tokens identical in both standard files and the full-trace wrapper", () => {
  for (const path of ["../e2e/timed-transitions.spec.ts", "../live/recommendations.spec.ts", "../integration/full-trace-timed-matrices.spec.ts"]) {
    const text = readFileSync(new URL(path, import.meta.url), "utf8");
    expect(matrixCallbackTokenHash(path, text), path).toBe(originalCallbackHash);
  }
});

it("ignores platform line endings outside tokens but rejects changed values and template text", () => {
  const path = "../e2e/timed-transitions.spec.ts";
  const lf = readFileSync(new URL(path, import.meta.url), "utf8").replaceAll("\r\n", "\n");
  expect(matrixCallbackTokenHash(path, lf)).toBe(originalCallbackHash);
  expect(matrixCallbackTokenHash(path, lf.replaceAll("\n", "\r\n"))).toBe(originalCallbackHash);
  expect(matrixCallbackTokenHash(path, lf.replace("600_000", "600_001"))).not.toBe(originalCallbackHash);
  expect(matrixCallbackTokenHash(path, lf.replace("${item.id}: ${perspective}", "${item.id} altered: ${perspective}")))
    .not.toBe(originalCallbackHash);
});
it("leaves global trace defaults unchanged and separates full-trace diagnostic registration", () => {
  for (const path of ["../../playwright.config.ts", "../live/checklist-config.ts"]) {
    expect(readFileSync(new URL(path, import.meta.url), "utf8")).toContain('trace: "retain-on-failure"');
  }
  for (const path of ["../live/route-diagnostic.config.ts", "../live/runtime-profile.config.ts"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    expect(source).toContain('testMatch: "full-trace-timed-matrices.spec.ts"');
    expect(source).toContain('trace: "on"');
  }
  const diagnostic = readFileSync(new URL("../integration/full-trace-timed-matrices.spec.ts", import.meta.url), "utf8");
  expect(diagnostic).toContain('import { test } from "../live/fixtures"');
  expect(diagnostic).not.toContain("timedTest");
  expect(readFileSync(new URL("../integration/first-a-runtime-profile.spec.ts", import.meta.url), "utf8"))
    .toContain('import { test } from "../live/fixtures"');
});

it("requires resolved-policy validation before the timed body and artifact collection only after it", () => {
  const source = readFileSync(new URL("../e2e/fixtures.ts", import.meta.url), "utf8");
  const guard = source.indexOf("resolved = verifyResolvedTracePolicy(trace, expected)");
  const body = source.indexOf("try { await use(); } finally { await collect(); }");
  expect(guard).toBeGreaterThan(0);
  expect(body).toBeGreaterThan(guard);
  expect(source).toContain('originalStatus: "not-run", expected, resolvedOption: trace');
  expect(source).toContain('"trace-artifact-policy"');
  expect(source).toContain('["failed", "timedOut", "interrupted"].includes(originalStatus)');
  expect(source).toContain('throw new Error("Diagnostics must use the full-trace base test, not timedTest.")');
});

it("declares lost optional coverage without claiming network or historical DOM parity", () => {
  expect(TIMED_TRACE_LOSSES).toEqual([
    "Continuous DOM snapshots", "Trace screencast frames", "HAR resource and network payload collection",
  ]);
});
