import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "../../src/components/demo/baseline-calculator";
import { BaselineAssumptions } from "../../src/components/demo/baseline-assumptions";
import { ProcessAssumptions } from "../../src/components/demo/process-assumptions";
import { MONTH_MODEL_DEFAULTS, MANUAL_LOOP_MONTH_DEFAULTS, baselineDefaultCopy, formatBaselineNumber } from "../../src/lib/domain/baseline";

// Change only the test's editable defaults. Documentary reference facts stay
// unchanged, so hard-coded synthetic prose cannot accidentally pass this test.
vi.mock("../../src/lib/domain/baseline", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/domain/baseline")>();
  return {
    ...original,
    MONTH_MODEL_DEFAULTS: { ...original.MONTH_MODEL_DEFAULTS, volume: 12_345, todayMinutes: 14, judgingMinutes: 3.25 },
    MANUAL_LOOP_MONTH_DEFAULTS: { ...original.MANUAL_LOOP_MONTH_DEFAULTS, monthlyItems: 123_450_000, manualLoopItems: 12_345, builtJudgingMinutes: 3.7 },
  };
});

describe("calculator UI consumes canonical defaults", () => {
  it("keeps changed legacy defaults on the historical register only", () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(BaselineAssumptions, { register: true })));
    const copy = baselineDefaultCopy(MONTH_MODEL_DEFAULTS);
    expect(html).toContain("Today: 14 minutes including gathering and judging. Built case: 3.25 minutes");
    expect(html).toContain("Default: 12,345");
    expect(html).toContain(copy.volumeContext);
    expect(html).not.toContain("Judging hours, both sides");
    expect(html).not.toContain("reference judging stays fixed");
    expect(html).not.toContain("Built case review minutes / item");
  });

  it.each([BaselineCalculator, ProcessAssumptions])("uses shared process defaults on %s", (Component) => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component)));
    expect(html).toContain(`Public default: ${formatBaselineNumber(MANUAL_LOOP_MONTH_DEFAULTS.monthlyItems, 2)}`);
    expect(html).toContain(`Public default: ${formatBaselineNumber(MANUAL_LOOP_MONTH_DEFAULTS.manualLoopItems, 2)}`);
    expect(html).toContain(`Assumption default: ${formatBaselineNumber(MANUAL_LOOP_MONTH_DEFAULTS.builtJudgingMinutes, 2)}`);
    expect(html).toContain('id="process-monthlyItems"');
    expect(html).not.toContain("minutes including gathering and judging");
    expect(html).not.toContain("Seven-step gathering");
  });
});