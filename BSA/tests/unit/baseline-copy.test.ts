import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { BaselineCalculator } from "../../src/components/demo/baseline-calculator";
import { BaselineAssumptions } from "../../src/components/demo/baseline-assumptions";
import { BASELINE_DEFAULTS, baselineDefaultCopy } from "../../src/lib/domain/baseline";

// Change only the test's editable defaults. Documentary reference facts stay
// unchanged, so hard-coded synthetic prose cannot accidentally pass this test.
vi.mock("../../src/lib/domain/baseline", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/lib/domain/baseline")>();
  return { ...original, BASELINE_DEFAULTS: { ...original.BASELINE_DEFAULTS, volume: 12_345, findFormMinutes: 3, builtReviewMinutes: 1.5, judgingMinutes: 3.25 } };
});

describe("calculator UI consumes canonical defaults", () => {
  it.each([false, true])("generates labels on the %s register surface from changed defaults", (register) => {
    const component = register ? createElement(BaselineAssumptions, { register }) : createElement(BaselineCalculator);
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, component));
    const copy = baselineDefaultCopy(BASELINE_DEFAULTS);
    expect(html).toContain(copy.manualAssumptions);
    expect(html).toContain("Gathering 7.5 minutes across seven steps, built review 1.5 minutes and judging 3.25 minutes");
    expect(html).toContain("Default: 12,345");
    expect(html).toContain(copy.volumeSource);
    if (!register) expect(html).toContain(renderToStaticMarkup(copy.volumeNote));
    expect(html).not.toContain("Gathering 5 minutes across seven steps");
  });
});