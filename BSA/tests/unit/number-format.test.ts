import { describe, expect, it, vi } from "vitest";
import { formatBaselineNumber } from "../../src/lib/domain/baseline";

describe("cached baseline number formatting", () => {
  for (const digits of [0, 1, 2, 4]) {
    it(`preserves UK grouping and rounding at precision ${digits}`, () => {
      for (const value of [0, -0, 0.00001, 1.005, -1.005, 999.99999, 85000, 1e9, Number.MAX_SAFE_INTEGER, NaN, Infinity, -Infinity]) {
        expect(formatBaselineNumber(value, digits)).toBe(value.toLocaleString("en-GB", { maximumFractionDigits: digits }));
      }
    });
  }

  it("retains the four-digit default and invalid precision errors", () => {
    expect(formatBaselineNumber(1234.56789)).toBe("1,234.5679");
    expect(() => formatBaselineNumber(1, -1)).toThrow(RangeError);
    expect(() => formatBaselineNumber(1, 101)).toThrow(RangeError);
  });

  it("constructs one formatter per precision, not per value or render", async () => {
    vi.resetModules();
    const NumberFormat = Intl.NumberFormat;
    const spy = vi.spyOn(Intl, "NumberFormat").mockImplementation(function (locales, options) {
      return new NumberFormat(locales, options);
    });
    try {
      const { formatBaselineNumber: format } = await import("../../src/lib/domain/baseline");
      // Module-level field hints all share precision four.
      expect(spy).toHaveBeenCalledTimes(1);
      for (let value = 0; value < 100; value++) {
        format(value);
        format(value, 1);
      }
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
      vi.resetModules();
    }
  });
});