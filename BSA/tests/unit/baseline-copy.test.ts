import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "../../src/components/demo/baseline-calculator";
import { BaselineAssumptions } from "../../src/components/demo/baseline-assumptions";
import { MONTH_MODEL_DEFAULTS, baselineDefaultCopy } from "../../src/lib/domain/baseline";
import { TooltipProvider } from "../../src/components/ui/tooltip";

// Change only the test's editable defaults. Documentary reference facts stay
// unchanged, so hard-coded synthetic prose cannot accidentally pass this test.
vi.mock("../../src/lib/domain/baseline", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/domain/baseline")>();
  return { ...original, MONTH_MODEL_DEFAULTS: { ...original.MONTH_MODEL_DEFAULTS, volume: 12_345, todayMinutes: 14, judgingMinutes: 3.25 } };
});

describe("calculator UI consumes canonical defaults", () => {
  it.each([false, true])("generates labels on the %s register surface from changed defaults", (register) => {
    const component = register ? createElement(BaselineAssumptions, { register }) : createElement(BaselineCalculator);
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(TooltipProvider, null, component)));
    const copy = baselineDefaultCopy(MONTH_MODEL_DEFAULTS);
    expect(html).toContain("Today: 14 minutes including gathering and judging. Built case: 3.25 minutes");
    expect(html).toContain("Default: 12,345");
    expect(html).toContain(copy.volumeContext);
    expect(html).not.toContain("Judging hours, both sides");
    expect(html).not.toContain("reference judging stays fixed");
    expect(html).not.toContain("Built case review minutes / item");
  });
});