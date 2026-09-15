import { describe, expect, it } from "vitest";
import { MANUAL_LOOP_MONTH_DEFAULTS, monthModel } from "@/lib/domain/baseline";
import { EPS_ERROR_EVIDENCE, EPS_MISMATCH_ESTIMATE } from "@/lib/domain/eps-error-evidence";
import { calculateMismatchEstimate, createMismatchSharePercent, selectMismatchEstimate } from "@/lib/domain/mismatch-estimate";

describe("optional submitted-claim mismatch estimate", () => {
  it("converts the 1% UI default to a 0.01 fraction independently of the study", () => {
    expect(createMismatchSharePercent()).toBe("1");
    expect(EPS_MISMATCH_ESTIMATE.defaultShare).toBe(0.01);
    const selection = selectMismatchEstimate("1", 100_000_000);
    expect(selection).toEqual({ errors: {}, result: {
      share: 0.01, submittedClaimVolume: 100_000_000, today: 0, withAgent: 1_000_000,
    } });
    expect(selection.result?.share).not.toBe(EPS_ERROR_EVIDENCE.study.pooledPrevalencePercent / 100);
    expect(EPS_MISMATCH_ESTIMATE.todayBasis).toContain("not evidence of an observed zero");
  });

  it("uses all submitted claims and never subtracts from existing cohorts or hours", () => {
    const inputs = Object.freeze({ ...MANUAL_LOOP_MONTH_DEFAULTS });
    const before = monthModel(inputs);
    const result = calculateMismatchEstimate(before.counts.monthlyItems, .01);
    expect(result.withAgent).toBe(1_000_000);
    expect(result.withAgent).not.toBe(before.cohorts.manualLoopItems * .01);
    expect(monthModel(inputs)).toEqual(before);
    expect(before.withAgent.operatorHours).toBe(297.5);
    expect(before.withAgent.referredBackItems).toBe(5100);
    expect(before.withAgent.pharmacyCompletionHours).toBe(510);
  });

  it.each([
    [0, "1", 0], [1_000_000_000, "100", 1_000_000_000], [120_000_000, "2.5", 3_000_000],
    [7, "12.5", .875], [100, ".05", .05], [100, "0", 0], [100, " 001.00 ", 1],
  ])("preserves share times volume without invented rounding: %s, %s", (volume, percent, expected) => {
    expect(selectMismatchEstimate(percent, volume).result?.withAgent).toBe(expected);
  });

  it.each(["", " ", "-1", "101", "NaN", "Infinity", "1e2", "0x10", "1,000",
    "100.000000000000000001", "9".repeat(400), `0.${"0".repeat(400)}1`, `0.${"0".repeat(321)}1`,
  ])("rejects invalid percentage %j without a fallback estimate", (text) => {
    expect(selectMismatchEstimate(text, 100_000_000)).toMatchObject({ result: null, errors: { sharePercent: expect.any(String) } });
  });

  it.each([null, NaN, Infinity, -1, 0.5, 1_000_000_001])("rejects unavailable or invalid submitted volume %s", (volume) => {
    expect(selectMismatchEstimate("1", volume)).toMatchObject({ result: null, errors: { submittedClaimVolume: expect.any(String) } });
  });

  it("validates direct numeric calls, not only the editor", () => {
    for (const volume of [NaN, Infinity, -1, .5, 1_000_000_001]) expect(() => calculateMismatchEstimate(volume, .01)).toThrow(RangeError);
    for (const share of [NaN, Infinity, -Infinity, -.01, 1.01]) expect(() => calculateMismatchEstimate(100, share)).toThrow(RangeError);
  });

  it("reports independent draft and denominator errors together", () => {
    expect(selectMismatchEstimate("", null)).toEqual({ result: null, errors: {
      sharePercent: expect.any(String), submittedClaimVolume: expect.any(String),
    } });
  });
});
