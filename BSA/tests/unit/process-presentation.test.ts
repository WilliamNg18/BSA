import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { ExceptionPipeline } from "@/components/demo/exception-pipeline";
import { MonthlyNumber } from "@/components/demo/monthly-number";
import { SceneEstimateNumber } from "@/components/demo/scene-estimate-number";
import { AssumptionsPage } from "@/pages/assumptions";
import { BoundaryPage } from "@/pages/boundary";
import { HomePage } from "@/pages/home";
import { PROCESS_MONTH_DEFAULTS, formatBaselineNumber, formatProcessHours, formatProcessItems, monthModel, type ProcessMonthInputs } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

function render(Component: ComponentType, path = "/") {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Component)));
}

beforeEach(() => {
  useAppStore.getState().resetDemo();
  useAppStore.getState().setPerspective("both");
});

describe("whole-process presentation", () => {
  it.each([0.1, 0.2, 7_222.222222, 96_000_000])("uses the same shared formatter for visible and accessible endpoints: %s", (value) => {
    for (const format of [formatProcessHours, formatProcessItems]) {
      const expected = format(value);
      const monthly = renderToStaticMarkup(createElement(MonthlyNumber, { value, format }));
      const scene = renderToStaticMarkup(createElement(SceneEstimateNumber, { value, format, enabled: true, scenario: monthModel(PROCESS_MONTH_DEFAULTS) }));
      for (const markup of [monthly, scene]) {
        expect(markup).toContain(`aria-label="${expected}"`);
        expect(markup).toContain(`<span aria-hidden="true">${expected}</span>`);
      }
    }
  });

  it.each([false, true])("shows both shared model columns without summing overlapping cohorts, agent %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const expected = monthModel(PROCESS_MONTH_DEFAULTS);
    const markup = render(BaselineCalculator);
    for (const column of ["today", "withAgent"] as const) {
      for (const key of ["referredBackItems", "referralOperatorHours", "pharmacyCompletionHours", "type2OperatorHours", "caughtBeforeSubmission", "decisionsWithRuleAndReason"] as const) {
        expect(markup).toMatch(new RegExp(`data-process-metric="${column}-${key}"[^]*?aria-label="${formatBaselineNumber(expected[column][key], 1)}"`));
      }
    }
    expect(markup).toContain("these hours must not be added together");
    expect(markup).toContain("Synthetic comparison only, not a statement that real staff never record rules or reasons.");
    expect(markup).toContain("Fewer items come back, and every judgement carries its rule and reason; the agent verifies and advises, it does not pay.");
    expect(markup).not.toContain("Items one operator can complete");
    expect(markup).not.toContain("Time is spent only");
    expect(markup).not.toContain('role="switch"');
  });

  it("uses edited process inputs in both calculator and scene without perspective-dependent state", () => {
    const inputs: ProcessMonthInputs = { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1_000, monthlyReferrals: 2, investigationMinutesToday: 0.01, pharmacyCompletionMinutes: 0.02 };
    for (const key of Object.keys(inputs) as (keyof ProcessMonthInputs)[]) useAppStore.getState().setProcessInput(key, String(inputs[key]));
    const expected = monthModel(inputs);
    for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      useAppStore.getState().setPerspective(perspective);
      const before = useAppStore.getState();
      const calculator = render(BaselineCalculator);
      const scene = render(BaselineScene);
      expect(calculator).toMatch(new RegExp(`data-process-metric="today-referralOperatorHours"[^]*?aria-label="${formatBaselineNumber(expected.today.referralOperatorHours, 1)}"`));
      expect(scene).toMatch(new RegExp(`data-scene-metric="autoPricedItems"[^]*?>${formatBaselineNumber(expected.counts.autoPricedItems, 1)}</span>`));
      expect(useAppStore.getState()).toBe(before);
    }
  });

  it("invalid shared inputs remove stale metrics and expose the invalid field", () => {
    useAppStore.getState().setProcessInput("monthlyItems", "invalid");
    const calculator = render(BaselineCalculator);
    expect(calculator).toContain('role="alert"');
    expect(calculator).toContain('aria-invalid="true"');
    expect(calculator).toContain('data-month-detail="true" open=""');
    expect(calculator).not.toContain("data-process-metric");
    expect(render(BaselineScene)).not.toContain("data-scene-metric");
    expect(render(ExceptionPipeline)).not.toContain("data-pipeline-referrals");
  });

  it("starts with automation and preserves separately qualified public context", () => {
    const markup = render(HomePage, "/#scene");
    expect(markup.indexOf('data-key-figure="automated-items"')).toBeLessThan(markup.indexOf('data-key-figure="staff-touch"'));
    expect(markup).toContain("Most items");
    expect(markup).toContain("Approximately 4%");
    expect(markup).toContain("Approximately 85,000");
    expect(markup).toContain("Over 100,000,000");
    expect(markup).toContain("91%");
    expect(markup).toContain("9%");
    expect(markup).toContain("2,200,000");
    expect(markup).toContain("2,000,000");
    expect(markup).toContain("not independently verified here");
  });

  it.each([false, true])("keeps branching and human authority in both pipeline modes: %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const markup = render(ExceptionPipeline);
    for (const stage of ["channels", "rules", "type1", "type2", "referred-back", "mys", "resubmit"]) expect(markup).toContain(`data-pipeline-stage="${stage}"`);
    expect(markup).toContain("data-auto-bypass");
    expect(markup).toContain("No Type 1 or Type 2 queue row.");
    expect(markup).toContain("EPS");
    expect(markup).toContain("dm+d");
    expect(markup).toContain("MYS Unpaid items");
    expect(markup).toContain("NHSmail");
    expect(markup.match(/data-agent-kernel=/g)?.length ?? 0).toBe(enabled ? 3 : 0);
    if (enabled) expect(markup).toContain("declared by the pharmacy, not read from the form");
    expect(markup).not.toContain('role="switch"');
    expect(markup).not.toContain("These items never enter");
  });

  it("retains opposite-side navigation guards", () => {
    useAppStore.getState().setPerspective("pharmacy");
    expect(render(ExceptionPipeline)).not.toContain('href="/queue"');
    useAppStore.getState().setPerspective("nhsbsa");
    const markup = render(ExceptionPipeline);
    expect(markup).not.toContain('href="/pharmacy"');
    expect(markup).not.toContain('href="/pharmacy/claims"');
  });

  it("shares current editable inputs with assumptions and labels the old register historical", () => {
    const markup = render(AssumptionsPage);
    expect(markup).toContain("Shared process assumptions");
    expect(markup).toContain('id="process-monthlyItems"');
    expect(markup).toContain("Historical referral-only comparison");
    expect(markup).toMatch(/<details[^>]*data-legacy-assumptions="true"[^>]*>/);
    expect(markup).not.toMatch(/<details[^>]*data-legacy-assumptions="true"[^>]*open/);
  });

  it("marks the unreadable-paper design proposed without inventing image certainty", () => {
    const markup = render(BoundaryPage);
    expect(markup).toContain("Proposed: poor-paper declaration path");
    expect(markup).toContain("The agent cannot read the poor scan");
    expect(markup).toContain("declared by the pharmacy, not read from the form");
    expect(markup).toContain("Type 2 judgement remains human");
  });

  it.each([false, true])("shows current routing in the four-case tour without an operator action for automatic A: %s", (enabled) => {
    useAppStore.getState().setAgentEnabled(enabled);
    const markup = render(HomePage, "/#cases");
    expect(markup).toContain('data-case="A" data-case-routing="auto_priced"');
    expect(markup).not.toContain("Open case A");
    expect(markup).toContain("no person involved");
    expect(markup).toContain('data-case="D" data-case-routing="type1_capture"');
    expect(markup).toContain("Unreadable paper");
    expect(markup).toContain("Open case D");
    if (enabled) expect(markup).toContain("Human-confirmed compatible declarations can support a built case");
    useAppStore.getState().submitItem({ caseId: "EX-24107", channel: "eps", endorsementText: "NCSO RK" });
    const resubmitted = render(HomePage, "/#cases");
    expect(resubmitted).toContain('data-case="A" data-case-routing="type2_endorsement"');
    expect(resubmitted).toContain("Open case A");
  });
});
