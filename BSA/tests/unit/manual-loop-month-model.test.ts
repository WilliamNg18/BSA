import { describe, expect, it } from "vitest";
import { MANUAL_LOOP_INPUT_METADATA, MANUAL_LOOP_MONTH_DEFAULTS as defaults, MONTH_MODEL_DEFAULTS, PROCESS_MONTH_DEFAULTS, monthModel, type ManualLoopMonthDraft, type ManualLoopMonthInputs } from "@/lib/domain/baseline";
import { calculateManualLoopMonth, createManualLoopDraft, manualLoopInputMaximum, selectManualLoopMonth } from "@/lib/domain/manual-loop-month-model";
import { manualLoopRatio, manualLoopSummary } from "@/lib/domain/manual-loop-presentation";

const keys = Object.keys(defaults) as (keyof ManualLoopMonthInputs)[];

describe("defensible sequential referral-loop estimates", () => {
  it("pins the frozen default tiles, total effort and sequential cohorts", () => {
    const result = monthModel(defaults);
    expect(result).toEqual(calculateManualLoopMonth(defaults));
    expect(result.cohorts).toEqual({ manualLoopItems: 85000, prevented: 68000, afterPrevention: 17000,
      clearedBeforeQueue: 11900, queued: 5100, abstained: 255, built: 4845 });
    expect(result.today).toEqual({ itemsGathered: 85000, itemsJudged: 106250, doubleChecks: 21250,
      referredBackItems: 85000, gatheringHours: 85000 * 10 / 60, judgingHours: 4250, doubleCheckHours: 1062.5,
      operatorHours: 85000 * 10 / 60 + 85000 * 3 / 60 + 21250 * 3 / 60,
      pharmacyCompletionHours: 8500, decisionsWithRuleAndReason: 0 });
    expect(result.withAgent).toEqual({ itemsGathered: 255, itemsJudged: 5100, doubleChecks: 0,
      referredBackItems: 5100, gatheringHours: 42.5, judgingHours: 255, doubleCheckHours: 0,
      operatorHours: 297.5, pharmacyCompletionHours: 510, decisionsWithRuleAndReason: 5100 });
    expect(result.operatorHoursRatio).toBe(result.today.operatorHours / 297.5);
    expect(result.counts).toEqual(monthModel(PROCESS_MONTH_DEFAULTS).counts);
    expect(result.type1).toEqual({ keySeconds: 30, confirmSeconds: 10 });
  });

  it("composes all four shares independently without losing or creating items", () => {
    for (const total of [0, 1, 2, 3, 7, 99, 85000, 1_000_000_000]) {
      for (const preventionPercent of [0, 33.3333, 80, 100]) {
        for (const clearancePercent of [0, 50, 70, 100]) {
          for (const abstentionPercent of [0, 5, 50, 100]) {
            for (const doubleCheckPercent of [0, 25, 100]) {
              const result = monthModel({ ...defaults, monthlyItems: total, manualLoopItems: total,
                type1Percent: 100, type2Percent: 100, staffTouchPercent: 100,
                preventionPercent, clearancePercent, abstentionPercent, doubleCheckPercent });
              const c = result.cohorts;
              expect(c.prevented + c.afterPrevention).toBe(total);
              expect(c.clearedBeforeQueue + c.queued).toBe(c.afterPrevention);
              expect(c.abstained + c.built).toBe(c.queued);
              expect(c.prevented + c.clearedBeforeQueue + c.abstained + c.built).toBe(total);
              expect(result.today.doubleChecks).toBe(Math.round(total * doubleCheckPercent / 100));
              expect(result.withAgent.referredBackItems).toBe(c.queued);
              expect(result.withAgent.itemsGathered).toBe(c.abstained);
              expect(result.withAgent.itemsJudged).toBe(c.queued);
            }
          }
        }
      }
    }
  });

  it("counts abstention gathering without inventing a referral-reduction share or free human confirmation", () => {
    for (const abstentionPercent of [0, 100]) {
      const result = monthModel({ ...defaults, abstentionPercent });
      expect(result.withAgent.referredBackItems).toBe(5100);
      expect(result.withAgent.judgingHours).toBe(255);
      expect(result.withAgent.operatorHours).toBe(abstentionPercent === 0 ? 255 : 1105);
      expect(result.withAgent.decisionsWithRuleAndReason).toBe(5100);
    }
    const allQueued = monthModel({ ...defaults, preventionPercent: 0, clearancePercent: 0 });
    expect(allQueued.withAgent.itemsJudged).toBe(85000);
    expect(MANUAL_LOOP_INPUT_METADATA.clearancePercent.definition).toContain("code clearance");
    expect(MANUAL_LOOP_INPUT_METADATA.abstentionPercent.provenance).toBe("assumption");
    expect(MANUAL_LOOP_INPUT_METADATA.abstentionPercent.definition).toContain("not an observed rate");
  });

  it("accepts zero times and empty cohorts without division-by-zero or stale estimates", () => {
    const zero = Object.fromEntries(keys.map((key) => [key, 0])) as unknown as ManualLoopMonthInputs;
    const result = monthModel(zero);
    expect(result.operatorHoursRatio).toBeNull();
    expect(result.withAgent.operatorHours).toBe(0);
    expect(result.today.operatorHours).toBe(0);
    expect(manualLoopRatio(result)).toContain("Ratio unavailable");
    expect(selectManualLoopMonth(Object.fromEntries(keys.map((key) => [key, "0"])) as ManualLoopMonthDraft).result).toEqual(result);
    expect(monthModel({ ...defaults, preventionPercent: 100 }).operatorHoursRatio).toBeNull();
    expect(monthModel({ ...defaults, gatheringMinutesToday: 0, judgingMinutesToday: 0 }).operatorHoursRatio).toBe(0);
  });

  it("keeps maximum bounded outputs finite and preserves immutable input", () => {
    const input = Object.freeze(Object.fromEntries(keys.map((key) => [key, manualLoopInputMaximum(key)])) as unknown as ManualLoopMonthInputs);
    const result = monthModel(input);
    for (const group of [result.counts, result.cohorts, result.today, result.withAgent, result.type1]) {
      for (const value of Object.values(group)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      }
    }
    expect(monthModel(input)).toEqual(result);
  });

  it.each(keys)("validates every scalar and decimal draft boundary: %s", (key) => {
    for (const value of [-1, NaN, Infinity, -Infinity, manualLoopInputMaximum(key) + 1]) {
      expect(() => monthModel({ ...defaults, [key]: value })).toThrow(RangeError);
    }
    for (const text of ["", " ", "-1", "NaN", "Infinity", "1e2", "0x10", "1,000",
      `${manualLoopInputMaximum(key)}.00000000000000000001`, "9".repeat(400), `0.${"0".repeat(400)}1`]) {
      const draft = { ...createManualLoopDraft(), [key]: text };
      const before = structuredClone(draft);
      expect(selectManualLoopMonth(draft)).toMatchObject({ input: null, result: null, errors: { [key]: expect.any(String) } });
      expect(draft).toEqual(before);
    }
    const missing: Partial<ManualLoopMonthDraft> = createManualLoopDraft();
    delete missing[key];
    expect(selectManualLoopMonth(missing as ManualLoopMonthDraft).errors[key]).toBeTruthy();
  });

  it("accepts ordinary decimals, but rejects fractional counts and impossible parent cohorts", () => {
    expect(selectManualLoopMonth({ ...createManualLoopDraft(), gatheringMinutesToday: " .5 ", preventionPercent: "080.0" }).input)
      .toMatchObject({ gatheringMinutesToday: .5, preventionPercent: 80 });
    for (const key of ["monthlyItems", "manualLoopItems"] as const) {
      expect(selectManualLoopMonth({ ...createManualLoopDraft(), [key]: "0.5" }).errors[key]).toBeTruthy();
      expect(() => monthModel({ ...defaults, [key]: 0.5 })).toThrow(RangeError);
    }
    for (const patch of [{ staffTouchPercent: 1 }, { staffTouchPercent: 5 }, { manualLoopItems: 2_000_001 }]) {
      expect(() => monthModel({ ...defaults, ...patch })).toThrow(RangeError);
    }
  });

  it("generates fewer than 25 words and preserves real legacy overloads", () => {
    const summary = manualLoopSummary(monthModel(defaults));
    expect(summary.split(/\s+/).length).toBeLessThan(25);
    expect(summary).toContain("297.5 operator hours gathering and judging");
    expect(summary).toContain("19,479.2");
    expect(summary).toContain("Estimate");
    expect(monthModel(MONTH_MODEL_DEFAULTS).volume).toBe(85000);
    expect(monthModel(PROCESS_MONTH_DEFAULTS).withAgent.referredBackItems).toBe(68000);
  });
});
