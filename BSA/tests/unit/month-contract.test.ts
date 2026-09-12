import { afterEach, describe, expect, it } from "vitest";
import { baselineDraft, MONTH_MODEL_DEFAULTS, monthModel, selectMonthScenario } from "../../src/lib/domain/baseline";
import { useAppStore } from "../../src/lib/store";

afterEach(() => {
  useAppStore.getState().setPerspective("both");
  useAppStore.getState().resetDemo();
});

describe("shared monthly projection contract", () => {
  it("pins both default headline tiles without double-counting judgement", () => {
    const result = monthModel(MONTH_MODEL_DEFAULTS);
    expect(result).toMatchObject({ volume: 85000, pharmacyCaught: 14167, cleared: 14167, abstained: 14167, built: 42499 });
    expect(result.today.operatorHours).toBe(17000);
    expect(result.withAgent.operatorHours).toBe(255002 / 60);
    expect(result.capacity).toEqual({ workingMinutes: 7560, today: 630, withAgent: 3780 });
    expect(result.perItem.today).toEqual({ gatheringMinutes: 10, judgingMinutes: 2 });
    expect(result.perItem.withAgent).toEqual({ gatheringMinutes: 0, judgingMinutes: 2 });
    expect(result.gatheringSteps.reduce((sum, step) => sum + step.minutes, 0)).toBe(10);
    expect(result.withAgent.gatheringMinutes + result.withAgent.judgingMinutes).toBe(255002);
  });

  it("charges abstentions as today and avoids operator effort for caught/cleared cohorts", () => {
    const input = { ...MONTH_MODEL_DEFAULTS, volume: 12, precheckPercent: 0, clearedPercent: 0 };
    const manual = monthModel({ ...input, abstainPercent: 100 });
    expect(manual.withAgent).toEqual(manual.today);
    expect(monthModel({ ...input, abstainPercent: 0 }).withAgent.operatorHours).toBe(24 / 60);
    expect(monthModel({ ...input, clearedPercent: 100 }).withAgent.operatorHours).toBe(0);
    expect(monthModel({ ...input, precheckPercent: 100 }).withAgent.operatorHours).toBe(0);
    expect(monthModel({ ...input, volume: 0 }).today.operatorHours).toBe(0);
  });

  it("all consumers receive the same changed shared inputs and explicit invalid state", () => {
    const current = () => {
      const state = useAppStore.getState();
      return selectMonthScenario(state.baselineInputs, state.todayMinutes);
    };
    const state = useAppStore.getState();
    state.setBaselineInput("volume", "120");
    expect(current().result?.today.operatorHours).toBe(24);
    state.setTodayMinutes("15");
    expect(current().result?.today.operatorHours).toBe(30);
    state.setBaselineInput("judgingMinutes", "3");
    expect(current().result?.capacity.withAgent).toBe(2520);
    expect(current().result?.perItem.today.gatheringMinutes).toBe(12);
    state.setBaselineInput("volume", "");
    expect(current().result).toBeNull();
    expect(current().errors.volume).toBeDefined();
  });

  it.each(["", "9.999999999999999999", "15.000000000000000001", "16", "NaN", "1e1"])("rejects invalid today draft %s", (today) => {
    const selected = selectMonthScenario(baselineDraft(MONTH_MODEL_DEFAULTS), today);
    expect(selected.result).toBeNull();
    expect(selected.errors.todayMinutes).toBeDefined();
  });

  it.each([0, -1, 13, NaN, Infinity, Number.MIN_VALUE])("rejects invalid judging minutes %s", (judgingMinutes) => {
    expect(() => monthModel({ ...MONTH_MODEL_DEFAULTS, judgingMinutes })).toThrow(RangeError);
  });
});

describe("perspective is a presentation preference", () => {
  it("defaults to both without removing existing routes or data", () => {
    expect(useAppStore.getState().perspective).toBe("both");
  });

  it.each(["pharmacy", "nhsbsa", "both"] as const)("keeps %s across toggles and Reset", (perspective) => {
    const before = useAppStore.getState();
    before.setPerspective(perspective);
    before.setAgentEnabled(true);
    const changed = useAppStore.getState();
    expect(changed.perspective).toBe(perspective);
    expect(changed.lifecycles).toBe(before.lifecycles);
    expect(changed.caseRevisions).toBe(before.caseRevisions);
    expect(changed.records).toBe(before.records);
    before.setTodayMinutes("15");
    before.resetDemo();
    expect(useAppStore.getState().perspective).toBe(perspective);
    expect(useAppStore.getState().agentEnabled).toBe(false);
    expect(useAppStore.getState().todayMinutes).toBe("12");
    expect(useAppStore.getState().baselineInputs).toEqual(baselineDraft(MONTH_MODEL_DEFAULTS));
  });
});
