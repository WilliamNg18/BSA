import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { MismatchEstimatePanel } from "@/components/demo/mismatch-estimate";
import { EPS_ERROR_EVIDENCE } from "@/lib/domain/eps-error-evidence";
import { monthModel, MANUAL_LOOP_MONTH_DEFAULTS } from "@/lib/domain/baseline";
import { selectManualLoopMonth } from "@/lib/domain/manual-loop-month-model";
import { getDomainSnapshot, useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const render = (Component: ComponentType) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component)));
const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

describe("Task 39 numbers use one authoritative optional draft", () => {
  it("renders only the verified study statement with its non-NHSBSA label", () => {
    const html = render(BaselineScene);
    expect(html).toContain(EPS_ERROR_EVIDENCE.study.chapterOneLine);
    expect(html).toContain(EPS_ERROR_EVIDENCE.study.label);
    expect(html).not.toMatch(/39 of 62|wrong strength among the most reported|1\.6[^<]*NHSBSA rate/i);
  });

  it.each(["both", "pharmacy", "nhsbsa"] as const)("shares edits without changing any old monthly result: %s", (perspective) => {
    store().setPerspective(perspective);
    const original = monthModel(MANUAL_LOOP_MONTH_DEFAULTS);
    for (const enabled of [false, true]) {
      store().setAgentEnabled(enabled);
      store().setMismatchSharePercent("2.5");
      const before = getDomainSnapshot();
      const html = render(BaselineCalculator);
      expect(html).toContain('value="2.5"');
      expect(html).toContain('aria-label="2,500,000"');
      expect(html).toContain('data-mismatch-today="true">none');
      expect(html).toContain("With the agent (estimate)");
      expect(html).toContain("not evidence of an observed zero rate");
      expect(html).toContain("Separate, non-additive estimate");
      expect(html).toContain("independent of the dispensing-error study");
      expect(html).toMatch(/data-mismatch-estimate="true"/);
      expect(html).not.toMatch(/<details[^>]*data-mismatch-estimate="true"[^>]*open/);
      expect(selectManualLoopMonth(store().manualLoopInputs).result).toEqual(original);
      expect(getDomainSnapshot()).toEqual(before);
    }
  });

  it("uses edited submitted volume rather than the referral subset and keeps optional invalidity local", () => {
    store().setManualLoopInput("monthlyItems", "120000000");
    store().setManualLoopInput("manualLoopItems", "42");
    expect(render(MismatchEstimatePanel)).toContain('aria-label="1,200,000"');
    for (const invalid of ["", "invalid", "100.00000000000000001"]) {
      store().setMismatchSharePercent(invalid);
      const html = render(BaselineCalculator);
      expect(html).toContain("Mismatch estimate unavailable");
      expect(html).toContain('aria-invalid="true"');
      expect(html).not.toContain('data-mismatch-with="true"');
      expect(html).toContain('data-process-metric="withAgent-operatorHours"');
      expect(selectManualLoopMonth(store().manualLoopInputs).result).not.toBeNull();
    }
    store().setMismatchSharePercent("1");
    store().setManualLoopInput("monthlyItems", "");
    expect(render(MismatchEstimatePanel)).toContain("Correct the shared monthly inputs");
    expect(render(MismatchEstimatePanel)).not.toContain('aria-label="1,200,000"');
  });

  it("records the editable assumption in the snapshot and resets it without resetting perspective", () => {
    store().setMismatchSharePercent("12.5");
    store().setPerspective("pharmacy");
    expect(getDomainSnapshot().mismatchSharePercent).toBe("12.5");
    store().setAgentEnabled(true);
    store().resetDemo();
    expect(store().mismatchSharePercent).toBe("1");
    expect(store().perspective).toBe("pharmacy");
    expect(store().agentEnabled).toBe(false);
  });
});
