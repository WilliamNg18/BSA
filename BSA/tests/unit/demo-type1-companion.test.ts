import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoStepLayout, type DemoTaskProps } from "../../src/components/demo/step-layouts";
import { Type1Capture, Type1CaptureEvidence } from "../../src/components/demo/type1-capture";
import { demoStepDestination, getDemoStep } from "../../src/lib/domain/demo-steps";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

afterEach(() => useAppStore.getState().resetDemo());

describe("same-item shared Type 1 evidence companion", () => {
  it.each([false, true])("preserves all evidence and metadata with one live form, Agent %s", (enabled) => {
    const store = useAppStore.getState();
    store.setDemoStep(7);
    store.followCase("EX-24123");
    store.setAgentEnabled(enabled);
    const before = getDomainSnapshot();
    const calls: DemoTaskProps[] = [];
    const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/case/EX-24123"] },
      createElement(DemoStepLayout, {
        renderType1Evidence: (caseId) => createElement(Type1CaptureEvidence, { caseId }),
        renderTask: (props) => {
          calls.push(props);
          return createElement(Fragment, null,
            enabled && createElement("section", { "aria-label": "Recommendation slot" }, "The task renderer's complete recommendation remains visible."),
            createElement(Type1Capture, { caseId: props.caseId, compact: true, evidencePlacement: props.evidencePlacement }));
        },
      })));
    expect(calls).toEqual([{ kind: "type1", caseId: "EX-24123", channel: "paper", allowCorrection: true, evidencePlacement: "external" }]);
    expect(html.match(/<form\b/g)).toHaveLength(1);
    expect(html.match(/data-demo-shared-evidence=/g)).toHaveLength(1);
    const today = html.indexOf('data-testid="demo-today"');
    const assisted = html.indexOf('data-testid="demo-assisted"');
    const shared = html.indexOf('data-demo-shared-evidence="EX-24123"');
    expect(shared > today).toBe(true);
    expect(shared < assisted).toBe(enabled);
    const inactive = enabled ? html.slice(today, assisted) : html.slice(assisted);
    expect(inactive).toContain("Shared original evidence (read-only)");
    expect(inactive).toContain("Synthetic scanned prescription form for case EX-24123.");
    expect(inactive).toContain("declared by the pharmacy, not read from the form");
    expect(inactive).not.toMatch(/<(?:input|textarea|button|form|select)\b/);
    expect(html).toContain("Current endorsement");
    expect(html).toContain("Paper");
    if (enabled) {
      expect(html).toContain("Gate 1");
      expect(html).toContain("Gate 2");
      expect(html).toContain("Reconciliation");
      expect(html).toContain("Not performed");
      expect(html).toContain("The task renderer&#x27;s complete recommendation remains visible.");
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("keeps inline evidence when no companion renderer is supplied", () => {
    useAppStore.getState().setDemoStep(10);
    const calls: DemoTaskProps[] = [];
    renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [demoStepDestination(getDemoStep(10))] },
      createElement(DemoStepLayout, { renderTask: (props) => { calls.push(props); return createElement("span", null, props.kind); } })));
    expect(calls).toHaveLength(1);
    expect(calls[0].kind).toBe("type1");
    expect(calls[0].evidencePlacement).toBeUndefined();
  });
});
