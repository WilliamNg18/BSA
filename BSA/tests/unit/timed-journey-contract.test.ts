import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it } from "vitest";

const source = readFileSync(new URL("../e2e/timed-transition-helpers.ts", import.meta.url), "utf8");
const journey = readFileSync(new URL("../e2e/timed-journey-helpers.ts", import.meta.url), "utf8");

it("checks the real pre-queue state after the destination URL and before queue navigation", () => {
  const url = source.indexOf("await expect(page).toHaveURL");
  const start = source.indexOf("for (const requirement of input.preQueueRequiredText");
  const queue = source.indexOf("await input.queue.link.click");
  expect(url).toBeGreaterThan(0);
  expect(start).toBeGreaterThan(url);
  expect(queue).toBeGreaterThan(start);
  const block = source.slice(start, queue);
  expect(block).toContain("await visibleWithinDeadline(requirement.locator, deadline)");
  expect(block).toContain("toHaveText(requirement.text, { timeout: deadline.remainingMs() })");
  expect(source).toContain('phase: "pre-queue"');
});

it("uses one original deadline spanning the actual click, state observation and queue checks", () => {
  const file = ts.createSourceFile("timed-transition-helpers.ts", source, ts.ScriptTarget.Latest, true);
  const deadlines: ts.NewExpression[] = [];
  function visit(node: ts.Node) {
    if (ts.isNewExpression(node) && node.expression.getText(file) === "TransitionDeadline") deadlines.push(node);
    ts.forEachChild(node, visit);
  }
  visit(file);
  expect(deadlines).toHaveLength(1);
  expect(deadlines[0].getStart(file)).toBeLessThan(source.indexOf("await input.action.click"));
  expect(source).toContain("await input.queue.link.click({ timeout: deadline.remainingMs() })");
  expect(source).toContain("observedElapsedMs = deadline.finish()");
});

it("requires an NHSBSA queue before any pre-queue observation can run", () => {
  const guard = source.indexOf('throw new Error("Pre-queue state requirements need an NHSBSA queue destination.")');
  expect(guard).toBeGreaterThan(0);
  expect(guard).toBeLessThan(source.indexOf("await expect(input.action)"));
  expect(source).toContain('destination: "NHSBSA"; queue: QueueTarget; preQueueRequiredText?: RequiredText[]');
  expect(source).toContain("queue?: undefined; preQueueRequiredText?: never");
});

it("observes A's real NHSBSA state in both modes while retaining the queue count and link", () => {
  const file = ts.createSourceFile("timed-journey-helpers.ts", journey, ts.ScriptTarget.Latest, true);
  const requirements: ts.PropertyAssignment[] = [];
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === "preQueueRequiredText") requirements.push(node);
    ts.forEachChild(node, visit);
  }
  visit(file);
  expect(requirements).toHaveLength(1);
  expect(requirements[0].initializer.getText(file)).toContain("automatic ?");
  expect(requirements[0].initializer.getText(file)).toContain("locator: caseState()");
  expect(requirements[0].initializer.getText(file)).toContain("LIFECYCLE_LABELS.released_to_pricing.nhsbsa.on");
  expect(requirements[0].initializer.getText(file)).toContain("LIFECYCLE_LABELS.paid.nhsbsa.off");
  expect(journey).toContain('name: "Shared case history", exact: true }).getByRole("status")');
  expect(journey).toContain('expectedTileText: automatic ? "Automated session items (1)"');
  expect(journey).toContain('destinationText: automatic ? `${id}: read-only record`');
});
