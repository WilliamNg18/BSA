import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it } from "vitest";
import { settleIndependentChecks } from "../support/independent-checks";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

async function drainMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

it("starts every independent predicate before any completes and waits for all", async () => {
  const gates = [deferred(), deferred(), deferred()];
  const started: number[] = [];
  let continued = false;
  const result = settleIndependentChecks(gates.map((gate, index) => () => {
    started.push(index);
    return gate.promise;
  })).then(() => { continued = true; });
  expect(started).toEqual([0, 1, 2]);
  gates[0].resolve();
  gates[1].resolve();
  await drainMicrotasks();
  expect(continued).toBe(false);
  gates[2].resolve();
  await result;
  expect(continued).toBe(true);
});

it("does not propagate one rejection until the remaining observations settle", async () => {
  const gates = [deferred(), deferred(), deferred()];
  const failure = new Error("Viewport requirement failed");
  let settled = false;
  const result = settleIndependentChecks(gates.map((gate) => () => gate.promise));
  const observed = result.then(
    () => { settled = true; return null; },
    (error: unknown) => { settled = true; return error; },
  );
  gates[0].reject(failure);
  await drainMicrotasks();
  expect(settled).toBe(false);
  gates[1].resolve();
  await drainMicrotasks();
  expect(settled).toBe(false);
  gates[2].resolve();
  expect(await observed).toBe(failure);
});

it("captures a synchronous deadline guard without preventing other checks from starting", async () => {
  const failure = new Error("No time remains");
  const gate = deferred();
  const started: number[] = [];
  let settled = false;
  const result = settleIndependentChecks([
    () => { started.push(0); throw failure; },
    () => { started.push(1); return gate.promise; },
    async () => { started.push(2); },
  ]);
  const observed = result.catch((error: unknown) => { settled = true; return error; });
  expect(started).toEqual([0, 1, 2]);
  await drainMicrotasks();
  expect(settled).toBe(false);
  gate.resolve();
  expect(await observed).toBe(failure);
});

it("retains every original failure and message after all checks settle", async () => {
  const first = new Error("Deadline guard failed");
  const second = new Error("Opacity requirement failed");
  const gate = deferred();
  let settled = false;
  const result = settleIndependentChecks([
    () => { throw first; },
    async () => { throw second; },
    () => gate.promise,
  ]);
  const observed = result.catch((error: unknown) => { settled = true; return error; });
  await drainMicrotasks();
  expect(settled).toBe(false);
  gate.resolve();
  const failure = await observed;
  expect(failure).toBeInstanceOf(AggregateError);
  if (!(failure instanceof AggregateError)) throw new Error("Multiple failures must remain an aggregate.");
  expect(failure.errors).toEqual([first, second]);
  expect(failure.message).toContain(first.message);
  expect(failure.message).toContain(second.message);
});

it("keeps exactly the three original visibility predicates on the same deadline", () => {
  const source = readFileSync(new URL("../e2e/timed-transition-helpers.ts", import.meta.url), "utf8");
  const file = ts.createSourceFile("timed-transition-helpers.ts", source, ts.ScriptTarget.Latest, true);
  const fn = file.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "visibleWithinDeadline");
  if (!fn || !ts.isFunctionDeclaration(fn) || !fn.body) throw new Error("The original visibility helper must remain.");
  const calls: ts.CallExpression[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(file) === "settleIndependentChecks") calls.push(node);
    ts.forEachChild(node, visit);
  }
  visit(fn);
  expect(calls).toHaveLength(1);
  const checks = calls[0].arguments[0];
  if (!ts.isArrayLiteralExpression(checks)) throw new Error("Visibility checks must use an explicit settled barrier.");
  expect(checks.elements).toHaveLength(3);
  expect(checks.elements.every(ts.isArrowFunction)).toBe(true);
  const body = fn.body.getText(file);
  expect(body).toContain("await settleIndependentChecks");
  expect(body).toContain("toBeVisible({ timeout: deadline.remainingMs() })");
  expect(body).toContain("toBeInViewport({ ratio: 1, timeout: deadline.remainingMs() })");
  expect(body).toContain('style.visibility !== "visible" || style.display === "none"');
  expect(body).toContain("opacity *= Number(style.opacity)");
  expect(body).toContain("Number.isFinite(opacity) && opacity >= 0.99");
  expect(body).toContain("intervals: [16]");
  expect(body.match(/deadline\.remainingMs\(\)/g)).toHaveLength(4);
  expect(body).not.toContain("new TransitionDeadline");
});
