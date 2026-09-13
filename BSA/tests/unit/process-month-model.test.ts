import { describe, expect, it } from "vitest";
import { monthModel, MONTH_MODEL_DEFAULTS, PROCESS_MONTH_DEFAULTS, type ProcessMonthDraft } from "../../src/lib/domain/baseline";
import { calculateProcessMonth, selectProcessMonth } from "../../src/lib/domain/process-month-model";

const draft = (): ProcessMonthDraft => Object.fromEntries(Object.entries(PROCESS_MONTH_DEFAULTS).map(([key, value]) => [key, String(value)])) as ProcessMonthDraft;

describe("whole-process monthly arithmetic", () => {
  it("pins all default counts and separate workforce estimates", () => {
    const result = calculateProcessMonth(PROCESS_MONTH_DEFAULTS);
    expect(result.counts).toEqual({ monthlyItems: 100_000_000, epsItems: 91_000_000, paperItems: 9_000_000,
      type1Items: 2_200_000, type2Items: 2_000_000, staffTouchedItems: 4_000_000, autoPricedItems: 96_000_000 });
    expect(result.today).toEqual({ type2OperatorHours: 26_000_000 / 3600, referralOperatorHours: 340_000 / 60,
      pharmacyCompletionHours: 8500, referredBackItems: 85000, caughtBeforeSubmission: 0, builtCases: 0,
      abstainedItems: 0, decisionsWithRuleAndReason: 0, monthlyRuleAssurance: "experience_only" });
    expect(result.withAgent).toEqual({ type2OperatorHours: (1_652_500 * 45 + 330_500 * 13) / 3600,
      referralOperatorHours: 272_000 / 60, pharmacyCompletionHours: 6800, referredBackItems: 68000,
      caughtBeforeSubmission: 17000, builtCases: 1_652_500, abstainedItems: 330_500,
      decisionsWithRuleAndReason: 1_652_500, monthlyRuleAssurance: "clause_and_version_cited" });
    expect(result.withAgent.type2OperatorHours).toBeGreaterThan(result.today.type2OperatorHours);
    expect(result.type1).toEqual({ keySeconds: 30, confirmSeconds: 10 });
  });
  it("conserves rounded cohorts across tiny and maximum item counts", () => {
    for (const monthlyItems of [0, 1, 2, 3, 7, 100, 1_000_000_000]) {
      for (const rate of [0, 33.3333, 100]) {
        const input = { ...PROCESS_MONTH_DEFAULTS, monthlyItems, epsPercent: rate, type1Percent: 50, type2Percent: 50,
          staffTouchPercent: 50, monthlyReferrals: Math.round(monthlyItems * .5), pharmacyCatchPercent: rate, abstainPercent: rate };
        const { counts, withAgent } = calculateProcessMonth(input);
        expect(counts.epsItems + counts.paperItems).toBe(monthlyItems);
        expect(counts.staffTouchedItems + counts.autoPricedItems).toBe(monthlyItems);
        expect(withAgent.caughtBeforeSubmission + withAgent.builtCases + withAgent.abstainedItems).toBe(counts.type2Items);
        expect(withAgent.caughtBeforeSubmission + withAgent.referredBackItems).toBe(input.monthlyReferrals);
        expect(Number.isFinite(withAgent.type2OperatorHours)).toBe(true);
      }
    }
  });
  it("changes referral counts only through the catch assumption", () => {
    for (const abstainPercent of [0, 100]) {
      const result = calculateProcessMonth({ ...PROCESS_MONTH_DEFAULTS, abstainPercent });
      expect(result.withAgent.referredBackItems).toBe(68000);
      expect(result.withAgent.referralOperatorHours).toBe(272000 / 60);
    }
  });
  it("rejects invalid overlap, referral and scalar inputs rather than clamping", () => {
    for (const patch of [{ staffTouchPercent: 2 }, { staffTouchPercent: 5 }, { monthlyReferrals: 2_000_001 },
      { monthlyItems: Infinity }, { monthlyItems: 1.5 }, { epsPercent: 101 }, { builtJudgingSeconds: -1 }]) {
      expect(() => calculateProcessMonth({ ...PROCESS_MONTH_DEFAULTS, ...patch })).toThrow(RangeError);
    }
  });
  it.each(["", "-1", "NaN", "Infinity", "1e2", "0x10", "100.000000000000000001"])("retains invalid draft %s with no stale estimate", (value) => {
    const input = { ...draft(), epsPercent: value };
    const before = structuredClone(input);
    expect(selectProcessMonth(input)).toMatchObject({ input: null, result: null, errors: { epsPercent: expect.any(String) } });
    expect(input).toEqual(before);
  });
  it("does not fall back to defaults for a missing input", () => {
    expect(selectProcessMonth({ ...draft(), monthlyItems: "" }).result).toBeNull();
    expect(selectProcessMonth(draft()).result).toEqual(calculateProcessMonth(PROCESS_MONTH_DEFAULTS));
  });
  it("exports the new process overload without replacing the legacy calculation", () => {
    expect(monthModel(PROCESS_MONTH_DEFAULTS)).toEqual(calculateProcessMonth(PROCESS_MONTH_DEFAULTS));
    expect(monthModel(MONTH_MODEL_DEFAULTS).volume).toBe(85000);
  });
});
