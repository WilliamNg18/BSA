import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoStepLayout, type DemoTaskProps } from "../../src/components/demo/step-layouts";
import { DemoStrip } from "../../src/components/demo/demo-strip";
import { DEMO_STEPS, demoStepDestination } from "../../src/lib/domain/demo-steps";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

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
});
