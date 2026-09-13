import { describe, expect, it } from "vitest";
import { formatProcessHours, formatProcessItems, monthModel, MONTH_MODEL_DEFAULTS, PROCESS_MONTH_DEFAULTS, type ProcessMonthDraft, type ProcessMonthInputs } from "../../src/lib/domain/baseline";
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
  it("fails closed for every missing, nonfinite or negative field", () => {
    for (const key of Object.keys(PROCESS_MONTH_DEFAULTS) as (keyof ProcessMonthInputs)[]) {
      const missing: Partial<ProcessMonthDraft> = draft();
      delete missing[key];
      expect(selectProcessMonth(missing as ProcessMonthDraft)).toMatchObject({
        input: null, result: null, errors: { [key]: expect.any(String) },
      });
      for (const value of [NaN, Infinity, -Infinity, -1]) {
        expect(() => monthModel({ ...PROCESS_MONTH_DEFAULTS, [key]: value })).toThrow(RangeError);
      }
    }
  });
  it("rounds overlapping lanes independently rather than summing them", () => {
    const input = { ...PROCESS_MONTH_DEFAULTS, monthlyItems: 7, epsPercent: 50,
      type1Percent: 50, type2Percent: 50, staffTouchPercent: 50, monthlyReferrals: 3,
      pharmacyCatchPercent: 50, abstainPercent: 50 };
    const result = monthModel(input);
    expect(result.counts).toEqual({ monthlyItems: 7, epsItems: 4, paperItems: 3,
      type1Items: 4, type2Items: 4, staffTouchedItems: 4, autoPricedItems: 3 });
    expect(result.withAgent).toMatchObject({ caughtBeforeSubmission: 2, abstainedItems: 1,
      builtCases: 1, referredBackItems: 1 });
    expect(monthModel({ ...input, staffTouchPercent: 100 }).counts.staffTouchedItems).toBe(7);
    expect(() => monthModel({ ...input, staffTouchPercent: 40 })).toThrow(RangeError);
  });
  it("reports cross-field draft errors without returning a fallback estimate", () => {
    for (const patch of [{ staffTouchPercent: "2" }, { staffTouchPercent: "5" },
      { monthlyReferrals: "2000001" }]) {
      const selection = selectProcessMonth({ ...draft(), ...patch });
      expect(selection.input).toBeNull();
      expect(selection.result).toBeNull();
      expect(selection.errors[Object.keys(patch)[0] as keyof ProcessMonthInputs]).toBeTruthy();
    }
  });
  it("keeps hard-paper assumptions local and separate effort measures independent", () => {
    const original = monthModel(PROCESS_MONTH_DEFAULTS);
    const local = monthModel({ ...PROCESS_MONTH_DEFAULTS, type1KeySeconds: 120, type1ConfirmSeconds: 60 });
    expect(local).toEqual({ ...original, type1: { keySeconds: 120, confirmSeconds: 60 } });
    const tail = monthModel({ ...PROCESS_MONTH_DEFAULTS, investigationMinutesToday: 8,
      pharmacyCompletionMinutes: 12 });
    for (const column of ["today", "withAgent"] as const) {
      expect(tail[column].type2OperatorHours).toBe(original[column].type2OperatorHours);
      expect(tail[column].referralOperatorHours).toBe(original[column].referralOperatorHours * 2);
      expect(tail[column].pharmacyCompletionHours).toBe(original[column].pharmacyCompletionHours * 2);
    }
  });
  it("retains manual Type 2 effort for all abstentions and removes only caught referrals", () => {
    const allManual = monthModel({ ...PROCESS_MONTH_DEFAULTS, pharmacyCatchPercent: 0, abstainPercent: 100 });
    expect(allManual.withAgent.type2OperatorHours).toBe(allManual.today.type2OperatorHours);
    expect(allManual.withAgent.decisionsWithRuleAndReason).toBe(0);
    const allCaught = monthModel({ ...PROCESS_MONTH_DEFAULTS, monthlyReferrals: 2_000_000,
      pharmacyCatchPercent: 100 });
    expect(allCaught.withAgent).toMatchObject({ type2OperatorHours: 0, referralOperatorHours: 0,
      pharmacyCompletionHours: 0, referredBackItems: 0, builtCases: 0, abstainedItems: 0,
      decisionsWithRuleAndReason: 0, caughtBeforeSubmission: 2_000_000 });
  });
  it("keeps every numeric output finite at large valid inputs without mutating inputs", () => {
    const input = Object.freeze({ ...PROCESS_MONTH_DEFAULTS, monthlyItems: 1_000_000_000,
      type1Percent: 100, type2Percent: 100, staffTouchPercent: 100, monthlyReferrals: 1_000_000_000,
      type2SecondsToday: 3600, builtJudgingSeconds: 3600, investigationMinutesToday: 1440,
      pharmacyCompletionMinutes: 1440 });
    const result = monthModel(input);
    for (const group of Object.values(result)) {
      for (const value of Object.values(group)) {
        if (typeof value === "number") {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
        }
      }
    }
    expect(monthModel(input)).toEqual(result);
  });
  it("exports the new process overload without replacing the legacy calculation", () => {
    expect(monthModel(PROCESS_MONTH_DEFAULTS)).toEqual(calculateProcessMonth(PROCESS_MONTH_DEFAULTS));
    expect(monthModel(MONTH_MODEL_DEFAULTS).volume).toBe(85000);
  });
  it("uses identical display precision without rounding the shared model", () => {
    const model = monthModel(PROCESS_MONTH_DEFAULTS);
    expect(formatProcessHours(model.today.referralOperatorHours)).toBe("5,666.7");
    expect(formatProcessHours(model.withAgent.referralOperatorHours)).toBe("4,533.3");
    expect(formatProcessItems(model.withAgent.builtCases)).toBe("1,652,500");
    expect(model.today.referralOperatorHours).toBe(340000 / 60);
  });
});
