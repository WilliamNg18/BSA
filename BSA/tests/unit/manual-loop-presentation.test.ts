import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "@/components/demo/baseline-calculator";
import { BaselineScene } from "@/components/demo/baseline-scene";
import { AutomaticPricingCount, ManualLoopProjection, PharmacyModelStrip } from "@/components/demo/manual-loop-projection";
import { ProcessAssumptions } from "@/components/demo/process-assumptions";
import { MANUAL_LOOP_INPUT_METADATA, MANUAL_LOOP_MONTH_DEFAULTS, formatProcessItems, monthModel, type ManualLoopMonthInputs } from "@/lib/domain/baseline";
import { createManualLoopDraft, selectManualLoopMonth } from "@/lib/domain/manual-loop-month-model";
import { MANUAL_LOOP_METRICS } from "@/lib/domain/manual-loop-presentation";
import { getDomainSnapshot, useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

const render = (Component: ComponentType) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component)));
const plain = (html: string) => html.replace(/<[^>]*>/g, "");
const metric = (html: string, attribute: string, key: string) => html.match(new RegExp(`${attribute}="${key}"[^>]*>([\\s\\S]*?)</dd>`))?.[1] ?? "";

beforeEach(() => useAppStore.getState().resetDemo());

describe("one selector across every importable monthly surface", () => {
  it.each([false, true])("renders exact shared values across edits and all perspectives, Agent %s", (enabled) => {
    for (const patch of [{}, { manualLoopItems: 12345, preventionPercent: 12.5, clearancePercent: 45.5, abstentionPercent: 37.5,
      gatheringMinutesToday: 6.25, judgingMinutesToday: 2.75, builtJudgingMinutes: 4.5, mysCompletionMinutes: .2 },
    { manualLoopItems: 0 }, { preventionPercent: 100 }]) {
      const input = { ...MANUAL_LOOP_MONTH_DEFAULTS, ...patch };
      for (const key of Object.keys(input) as (keyof ManualLoopMonthInputs)[]) useAppStore.getState().setManualLoopInput(key, String(input[key]));
      const expected = monthModel(input);
      for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
        const state = useAppStore.getState();
        state.setAgentEnabled(enabled);
        state.setPerspective(perspective);
        const before = getDomainSnapshot();
        const calculator = render(BaselineCalculator);
        const projection = render(ManualLoopProjection);
        const pharmacy = render(PharmacyModelStrip);
        const scene = render(BaselineScene);
        const automatic = render(AutomaticPricingCount);
        for (const { key, format } of MANUAL_LOOP_METRICS) {
          for (const column of ["today", "withAgent"] as const) {
            expect(plain(metric(calculator, "data-process-metric", `${column}-${key}`))).toBe(`${format(expected[column][key])}${column === "withAgent" ? "estimate" : ""}`);
          }
          expect(plain(metric(projection, "data-projection-metric", key))).toBe(`${format(expected.today[key])} / ${format(expected.withAgent[key])} (estimate)`);
          if (["referredBackItems", "operatorHours", "pharmacyCompletionHours"].includes(key)) {
            expect(plain(metric(pharmacy, "data-pharmacy-model", key))).toBe(`${format(expected[enabled ? "withAgent" : "today"][key])}${enabled ? " (estimate)" : ""}`);
          }
          if (key === "referredBackItems" || key === "operatorHours") {
            expect(plain(metric(scene, "data-scene-metric", key))).toBe(format(expected[enabled ? "withAgent" : "today"][key]));
          }
        }
        expect(automatic).toContain(`no person involved: ${formatProcessItems(expected.counts.autoPricedItems)}`);
        expect(plain(metric(pharmacy, "data-pharmacy-model", "prevented"))).toBe(enabled ? `${formatProcessItems(expected.cohorts.prevented)} (estimate)` : "0");
        expect(getDomainSnapshot()).toEqual(before);
      }
    }
  });

  it("never returns old values or defaults when any shared draft is invalid", () => {
    const components = [BaselineCalculator, BaselineScene, ManualLoopProjection, PharmacyModelStrip, AutomaticPricingCount];
    for (const key of Object.keys(MANUAL_LOOP_MONTH_DEFAULTS) as (keyof ManualLoopMonthInputs)[]) {
      useAppStore.getState().setManualLoopInput(key, "");
      expect(selectManualLoopMonth(useAppStore.getState().manualLoopInputs).result).toBeNull();
      for (const component of components) {
        const html = render(component);
        expect(html.toLowerCase()).toContain("unavailable");
        expect(html).not.toContain("297.5");
        expect(html).not.toContain("19,479.2");
      }
      useAppStore.getState().resetDemo();
    }
  });

  it("shows each editable field's definition and provenance without requiring a tooltip", () => {
    const html = render(ProcessAssumptions);
    for (const key of Object.keys(MANUAL_LOOP_MONTH_DEFAULTS) as (keyof ManualLoopMonthInputs)[]) {
      expect(html).toContain(`id="process-${key}"`);
      expect(html).toContain(`aria-describedby="process-${key}-definition"`);
      const escaped = renderToStaticMarkup(createElement("span", null, MANUAL_LOOP_INPUT_METADATA[key].definition)).slice(6, -7);
      expect(html).toContain(escaped);
    }
    expect(html).toContain("Central bet: referrals prevented at pharmacy (%)");
    expect(html).not.toContain("one of six");
  });

  it("shares Reset with the operational store while preserving perspective and historical defaults", () => {
    const state = useAppStore.getState();
    const originalLegacy = state.processInputs;
    state.setPerspective("pharmacy");
    state.setManualLoopInput("preventionPercent", "12.5");
    expect(getDomainSnapshot().manualLoopInputs.preventionPercent).toBe("12.5");
    expect(useAppStore.getState().processInputs).toBe(originalLegacy);
    state.setAgentEnabled(true);
    state.resetDemo();
    expect(useAppStore.getState().manualLoopInputs).toEqual(createManualLoopDraft());
    expect(useAppStore.getState().perspective).toBe("pharmacy");
    expect(useAppStore.getState().agentEnabled).toBe(false);
  });
});
