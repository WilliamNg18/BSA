import { describe, expect, it } from "vitest";
import { baselineDraft, GATHERING_STEPS, MONTH_MODEL_DEFAULTS, monthModel, selectMonthScenario } from "../../src/lib/domain/baseline";

describe("monthly model edge cases and gathering weights", () => {
  it("redistributes seven weights without increasing monthly total or capacity", () => {
    const result = monthModel(MONTH_MODEL_DEFAULTS);
    for (const { key } of GATHERING_STEPS) {
      const changed = monthModel({ ...MONTH_MODEL_DEFAULTS, [key]: 123 });
      expect(changed.today).toEqual(result.today);
      expect(changed.withAgent).toEqual(result.withAgent);
      expect(changed.capacity).toEqual(result.capacity);
      expect(changed.gatheringSteps.reduce((sum, step) => sum + step.minutes, 0)).toBeCloseTo(10, 12);
      expect(changed.gatheringSteps.find((step) => step.key === key)?.minutes).toBeGreaterThan(9);
    }
  });

  it("normalises subnormal weights before scaling a fractional gathering total", () => {
    const input = { ...MONTH_MODEL_DEFAULTS, judgingMinutes: 11.9 };
    for (const { key } of GATHERING_STEPS) input[key] = 0;
    input.findFormMinutes = Number.MIN_VALUE;
    const result = monthModel(input);
    expect(result.gatheringSteps[0].minutes).toBe(result.manualGatheringMinutes);
  });

  it("requires positive weights only when there is gathering to distribute", () => {
    const input = { ...MONTH_MODEL_DEFAULTS };
    for (const { key } of GATHERING_STEPS) input[key] = 0;
    expect(() => monthModel(input)).toThrow(RangeError);
    const result = monthModel({ ...input, judgingMinutes: 12 });
    expect(result.gatheringSteps.every((step) => step.minutes === 0)).toBe(true);
    expect(result.capacity.today).toBe(result.capacity.withAgent);
  });

  it.each(["12.00000000000000001", `00012.${"0".repeat(400)}1`])("rejects raw judging just over today's total: %s", (judgingMinutes) => {
    const draft = { ...baselineDraft(MONTH_MODEL_DEFAULTS), judgingMinutes };
    const selected = selectMonthScenario(draft, "12");
    expect(selected.input).toBeNull();
    expect(selected.result).toBeNull();
    expect(selected.errors.judgingMinutes).toContain("today's total");
  });

  it.each(["12", "012.000", "11.999999999999999999"])("accepts judging no greater than total: %s", (judgingMinutes) => {
    expect(selectMonthScenario({ ...baselineDraft(MONTH_MODEL_DEFAULTS), judgingMinutes }, "012.000").result).not.toBeNull();
  });

  it("keeps capacity finite and independent of volume and cohort fractions", () => {
    for (const volume of [0, 1, 1_000_000_000]) {
      for (const abstainPercent of [0, 50, 100]) {
        const result = monthModel({ ...MONTH_MODEL_DEFAULTS, volume, abstainPercent });
        expect(result.capacity).toEqual({ workingMinutes: 7560, today: 630, withAgent: 3780 });
        expect(result.pharmacyCaught + result.cleared + result.abstained + result.built).toBe(volume);
        expect(result.withAgent.operatorHours).toBe((result.built * 2 + result.abstained * 12) / 60);
        expect(result.today.operatorHours).toBe(volume * 12 / 60);
      }
    }
  });
});
