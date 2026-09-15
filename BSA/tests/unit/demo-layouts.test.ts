import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoStepLayout, type DemoTaskProps } from "../../src/components/demo/step-layouts";
import { DemoStrip } from "../../src/components/demo/demo-strip";
import { DEMO_STEPS, demoStepDestination } from "../../src/lib/domain/demo-steps";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { EPS_STRENGTH_COPY } from "../../src/lib/domain/eps-error-evidence";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});
afterEach(() => useAppStore.getState().resetDemo());

function render(path: string, renderTask: (props: DemoTaskProps) => ReturnType<typeof createElement>) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] },
    createElement(DemoStepLayout, { renderTask })));
}

describe("focused desktop step layouts", () => {
  it.each(DEMO_STEPS.flatMap((step) => [false, true].map((enabled) => ({ step, enabled }))))(
    "renders step $step.number in mode $enabled with only one live task surface",
    ({ step, enabled }) => {
      useAppStore.getState().setDemoStep(step.number);
      useAppStore.getState().setAgentEnabled(enabled);
      const before = getDomainSnapshot();
      const tasks: DemoTaskProps[] = [];
      const html = render(demoStepDestination(step), (props) => {
        tasks.push(props);
        return createElement("button", { "data-test-task": props.kind }, "Human task");
      });
      expect(html).toContain(`data-demo-step="${step.number}"`);
      expect(html.match(/<h1 /g)).toHaveLength(1);
      expect(html.match(/data-demo-comparison=/g)).toHaveLength(1);
      expect(html).toContain('grid-cols-2');
      expect(html).toContain("Read-only scenario projection");
      expect(html.match(/data-readonly="true"/g)).toHaveLength(1);
      expect(html.match(/data-readonly="false"/g)).toHaveLength(1);
      const taskStep = Boolean(step.caseId);
      expect(tasks).toHaveLength(taskStep ? 1 : 0);
      if (taskStep) {
        expect(tasks[0].caseId).toBe(step.caseId);
        const todayStart = html.indexOf('data-testid="demo-today"');
        const assistedStart = html.indexOf('data-testid="demo-assisted"');
        const taskPosition = html.indexOf("data-test-task=");
        expect(taskPosition > assistedStart).toBe(enabled);
        expect(taskPosition > todayStart).toBe(true);
      }
      if (step.number !== 8) {
        expect(html).not.toContain('data-demo-control="queue-filter"');
        expect(html).not.toContain("<table");
      }
      expect(html).not.toContain("Reset demo");
      expect(html).not.toContain('role="switch"');
      expect(html).not.toContain("Choose a paper scenario");
      expect(html).not.toContain("\u2014");
      expect(getDomainSnapshot()).toEqual(before);
    });

  it.each(["both", "pharmacy", "nhsbsa"] as const)("retains step and same item on explicit side links in %s", (perspective) => {
    useAppStore.getState().setDemoStep(10);
    useAppStore.getState().followCase("EX-24123");
    useAppStore.getState().setPerspective(perspective);
    const before = getDomainSnapshot();
    for (const [path, expected] of [["/pharmacy/claims?case=EX-24123", "claim"], ["/case/EX-24123", "type1"]] as const) {
      const tasks: DemoTaskProps[] = [];
      const html = render(path, (props) => { tasks.push(props); return createElement("span", null, props.kind); });
      expect(tasks).toEqual([{ kind: expected, caseId: "EX-24123", allowCorrection: true, channel: "paper" }]);
      expect(html).toContain('data-demo-step="10"');
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("shows an error, never another fixture, for an unavailable explicit queue case", () => {
    useAppStore.getState().setDemoStep(8);
    const html = render("/case/MISSING", () => createElement("button", null, "Must not render"));
    expect(html).toContain("Operational item unavailable: MISSING");
    expect(html).not.toContain("Must not render");
  });

  it.each(DEMO_STEPS.flatMap((step) => (["claim", "type1"] as const).flatMap((kind) =>
    [false, true].map((enabled) => ({ step, kind, enabled })))))(
    "opens the followed item from step $step.number on its $kind side, Agent $enabled, without losing the step",
    ({ step, kind, enabled }) => {
      useAppStore.getState().setDemoStep(step.number);
      useAppStore.getState().setAgentEnabled(enabled);
      useAppStore.getState().followCase("EX-24123");
      const before = getDomainSnapshot();
      const tasks: DemoTaskProps[] = [];
      const html = render(kind === "claim" ? "/pharmacy/claims?case=EX-24123" : "/case/EX-24123", (props) => {
        tasks.push(props);
        return createElement("button", null, props.kind);
      });
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({ kind, caseId: "EX-24123" });
      expect(html).toContain(`data-demo-step="${step.number}"`);
      expect(html).toContain('data-demo-live-case="EX-24123"');
      expect(html).not.toContain("data-demo-month");
      expect(html).not.toContain("data-demo-pipeline");
      expect(html).not.toContain('data-demo-control="queue-filter"');
      expect(getDomainSnapshot()).toEqual(before);
    });

  it("keeps the entry visible in ordinary mode and the strip independent of perspective", () => {
    const strip = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(DemoStrip)));
    expect(strip()).toContain("Enter demo mode");
    expect(strip()).not.toContain("Exit demo");
    useAppStore.getState().setDemoStep(7);
    for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      useAppStore.getState().setPerspective(perspective);
      const html = strip();
      expect(html).toContain("Exit demo");
      expect(html).toContain("Jump to demo step");
      expect(html.match(/<option /g)).toHaveLength(11);
      expect(html).toContain("EX-24123");
      expect(html).toContain("Paper");
    }
  });

  it.each([false, true])("following A from a narrative step never invents operator work, Agent %s", (enabled) => {
    useAppStore.getState().setDemoStep(1);
    useAppStore.getState().setAgentEnabled(enabled);
    useAppStore.getState().followCase("EX-24107");
    const html = render("/case/EX-24107", () => createElement("span", null, "Recorded item"));
    expect(html).toContain("Following EX-24107 from step 1");
    expect(html).toContain(enabled ? "no person involved" : "no operator action");
    expect(html).not.toContain("Manual correction and review");
    expect(html).not.toContain("Type 1 confirms");
    expect(html).not.toContain("Type 2 judges");
  });

  it.each([false, true])("pairs strength pharmacy and operator steps without changing the submitted evidence, Agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const before = getDomainSnapshot();
    for (const [number, kind] of [[4, "submission"], [5, "operator"]] as const) {
      const step = DEMO_STEPS[number - 1];
      useAppStore.getState().setDemoStep(number);
      const tasks: DemoTaskProps[] = [];
      const html = render(demoStepDestination(step), (props) => {
        tasks.push(props);
        return createElement("span", null, "Current source task");
      });
      expect(tasks).toEqual([{ kind, caseId: "SYN-FQ123-MISMATCH", allowCorrection: true, channel: "eps" }]);
      expect(html).toContain(EPS_STRENGTH_COPY.proof);
      expect(html).not.toMatch(/missing date|format passes|wrong pack size/i);
      if (number === 5) expect(html).not.toContain(EPS_STRENGTH_COPY.suggestion);
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it.each([false, true])("follows the paper brand case with a matching paper comparison and ready label, Agent %s", (enabled) => {
    const state = useAppStore.getState();
    state.setDemoStep(1);
    state.setAgentEnabled(enabled);
    state.followCase("EX-24112");
    const before = getDomainSnapshot();
    for (const path of ["/case/EX-24112", "/pharmacy/claims?case=EX-24112"]) {
      const html = render(path, (props) => createElement("span", null, props.caseId));
      expect(html).toContain('data-demo-live-case="EX-24112"');
      expect(html).toContain(enabled ? "Paper brand or manufacturer required" : "Operator-approved field and rule, not a proposed value");
      expect(html).toContain("Resubmitted, ready to release");
      expect(html).not.toContain("No scenario comparison");
      expect(html).not.toContain(EPS_STRENGTH_COPY.suggestion);
      expect(getDomainSnapshot()).toEqual(before);
    }
  });
});
