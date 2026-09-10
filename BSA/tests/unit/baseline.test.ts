import { beforeEach, describe, expect, it, vi } from "vitest";
import { BASELINE_FIELDS, baselineDraft, baselineSummary, calculateBaseline, parseBaselineDraft, type BaselineInputs } from "../../src/lib/domain/baseline";
import { BASELINE_DEFAULTS, BASELINE_PROVENANCE, BASELINE_VOLUME_REFERENCE, baselineDefaultCopy } from "../../src/lib/domain/baseline-defaults";
import { CASES, QUEUE_FILLER } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { SOURCE_CLAIMS } from "../../src/lib/domain/source-claims";
import { useAppStore } from "../../src/lib/store";

describe("baseline source and synthetic default provenance", () => {
  it("uses O23's approximate referred-back monthly subset, not annual/12 or all exceptions", () => {
    const source = SOURCE_CLAIMS.find((claim) => claim.id === "O23")!.numbers.find((n) => n.unit === "referred-back items/month")!;
    expect(source.approximate).toBe(true);
    expect(BASELINE_DEFAULTS.volume).toBe(source.value);
    expect(BASELINE_DEFAULTS.volume).toBe(85_000);
    expect(BASELINE_DEFAULTS.volume).not.toBe(1_000_000 / 12);
  });

  it("pins the disclosed annual/monthly reference arithmetic to O23 and N01", () => {
    const annual = SOURCE_CLAIMS.find((claim) => claim.id === "O23")!.numbers.find((n) => n.value === 1_000_000)!;
    const derived = SOURCE_CLAIMS.find((claim) => claim.id === "N01")!.numbers[0];
    expect(BASELINE_VOLUME_REFERENCE.annual).toBe(annual.value);
    expect(BASELINE_VOLUME_REFERENCE.annual / BASELINE_VOLUME_REFERENCE.monthsPerYear).toBe(derived.value);
    expect(baselineDefaultCopy(BASELINE_DEFAULTS).volumeSource).toContain("1,000,000 / 12 = approximately 83,333.33, not exactly 85,000");
  });

  it("derives sequential percentages from the twelve seed rows without reclassifying recorded history", () => {
    const p = BASELINE_PROVENANCE;
    expect(CASES.length + QUEUE_FILLER.length).toBe(12);
    expect(p.pharmacy).toEqual({ ids: ["EX-24112", "EX-24109"], numerator: 2, denominator: 12 });
    expect(p.cleared).toEqual({ ids: ["EX-24101", "EX-24098"], numerator: 2, denominator: 10 });
    expect(p.abstain).toEqual({ ids: ["EX-24123", "EX-24120"], numerator: 2, denominator: 8 });
    const rows = [...CASES.map((c) => ({ state: c.initialState })), ...QUEUE_FILLER];
    expect(rows.filter((r) => r.state === "cleared_by_rules")).toHaveLength(2);
    expect(rows.filter((r) => r.state === "agent_abstained")).toHaveLength(2);
    expect(BASELINE_DEFAULTS.precheckPercent).toBe(2 / 12 * 100);
    expect(BASELINE_DEFAULTS.clearedPercent).toBe(20);
    expect(BASELINE_DEFAULTS.abstainPercent).toBe(25);
    expect(calculateBaseline({ ...BASELINE_DEFAULTS, volume: 12 })).toMatchObject({ pharmacyCaught: 2, cleared: 2, abstained: 2, built: 6 });
  });

  it("uses active recommended packs for latency and citation denominator, excluding D/E/F and fillers", () => {
    const packs = CASES.slice(0, 3).map((c) => runAgent(c));
    expect(BASELINE_PROVENANCE.assembly.ids).toEqual(CASES.slice(0, 3).map((c) => c.id));
    expect(BASELINE_DEFAULTS.assemblySeconds).toBe(packs.reduce((sum, p) => sum + p.assemblySeconds, 0) / packs.length);
    expect(BASELINE_PROVENANCE.citations).toEqual({ numerator: 3, denominator: 3 });
    expect(runAgent(CASES[3]).clause).toBeNull();
    expect(runAgent(CASES[4]).agentInvoked).toBe(false);
    expect(runAgent(CASES[4]).clause).toBeNull();
  });

  it("default derivation never invokes an engine for filler or historical rows", async () => {
    vi.resetModules();
    const agent = await import("../../src/lib/domain/agent");
    const spy = vi.spyOn(agent, "runAgent");
    try {
      await import("../../src/lib/domain/baseline-defaults");
      expect(spy.mock.calls.map(([item]) => item.id)).toEqual(CASES.slice(0, 5).map((c) => c.id));
    } finally {
      spy.mockRestore();
    }
  });
});

describe("baseline arithmetic", () => {
  it("conserves default rounded cohorts and separates gathering, judging and machine latency", () => {
    const result = calculateBaseline(BASELINE_DEFAULTS);
    expect(result).toMatchObject({ volume: 85_000, pharmacyCaught: 14_167, cleared: 14_167, abstained: 14_167, built: 42_499 });
    expect(result.today).toEqual({ gatheringMinutes: 425_000, judgingMinutes: 170_000, operatorHours: 595_000 / 60 });
    expect(result.withAgent).toEqual({ gatheringMinutes: 70_835, judgingMinutes: 113_332, operatorHours: 184_167 / 60 });
    expect(result.builtBeforeDecisionMinutes).toBe(2 + BASELINE_DEFAULTS.assemblySeconds / 60);
    expect(result.abstainBeforeDecisionMinutes).toBe(7);
    const slow = calculateBaseline({ ...BASELINE_DEFAULTS, assemblySeconds: 3600 });
    expect(slow.today).toEqual(result.today);
    expect(slow.withAgent).toEqual(result.withAgent);
    expect(slow.builtBeforeDecisionMinutes).toBe(62);
  });

  it("handles all zero values without division by zero", () => {
    const input = Object.fromEntries(Object.keys(BASELINE_DEFAULTS).map((key) => [key, 0])) as unknown as BaselineInputs;
    const result = calculateBaseline(input);
    expect(Object.values(result.today)).toEqual([0, 0, 0]);
    expect(Object.values(result.withAgent)).toEqual([0, 0, 0]);
    expect([result.pharmacyCaught, result.cleared, result.abstained, result.built, result.builtBeforeDecisionMinutes, result.abstainBeforeDecisionMinutes]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(baselineSummary(result, true)).not.toMatch(/NaN|Infinity/);
  });

  it.each([
    [100, 100, 100, [12, 0, 0, 0]],
    [0, 100, 100, [0, 12, 0, 0]],
    [0, 0, 100, [0, 0, 12, 0]],
    [0, 0, 0, [0, 0, 0, 12]],
  ])("applies sequential percentages %s/%s/%s", (precheckPercent, clearedPercent, abstainPercent, expected) => {
    const result = calculateBaseline({ ...BASELINE_DEFAULTS, volume: 12, precheckPercent: precheckPercent as number, clearedPercent: clearedPercent as number, abstainPercent: abstainPercent as number });
    expect([result.pharmacyCaught, result.cleared, result.abstained, result.built]).toEqual(expected);
  });

  it("conserves disjoint integer cohorts across tiny, decimal-rate and large safe scenarios", () => {
    for (const volume of [0, 1, 2, 7, 12, 85_000, 1_000_000_000]) {
      for (const p of [0, 0.00001, 33.333333333, 50, 99.99999, 100]) {
        for (const c of [0, 16.666666667, 100]) {
          for (const a of [0, 25.5, 100]) {
            const result = calculateBaseline({ ...BASELINE_DEFAULTS, volume, precheckPercent: p, clearedPercent: c, abstainPercent: a, gatheringMinutes: 1440, judgingMinutes: 1440 });
            const counts = [result.pharmacyCaught, result.cleared, result.abstained, result.built];
            expect(counts.every((n) => Number.isSafeInteger(n) && n >= 0 && n <= volume)).toBe(true);
            expect(counts.reduce((sum, n) => sum + n, 0)).toBe(volume);
            expect(Number.isFinite(result.today.operatorHours)).toBe(true);
            expect(result.withAgent.operatorHours).toBeLessThanOrEqual(result.today.operatorHours);
          }
        }
      }
    }
  });

  it("accepts fractional minutes and rates, but never fractional item volumes", () => {
    const draft = { ...baselineDraft(BASELINE_DEFAULTS), gatheringMinutes: ".25", judgingMinutes: "2.5", precheckPercent: "12.125" };
    expect(parseBaselineDraft(draft, 35).input).toMatchObject({ gatheringMinutes: 0.25, judgingMinutes: 2.5, precheckPercent: 12.125 });
    expect(parseBaselineDraft({ ...draft, volume: "1.1" }, 35).errors.volume).toBeDefined();
  });

  it("generates all cohorts from the result and hides assisted estimates when off", () => {
    const result = calculateBaseline(BASELINE_DEFAULTS);
    expect(baselineSummary(result, true)).toBe("Manual scenario: 85,000 items, 9,916.7 operator hours. With agent scenario: 14,167 pharmacy-caught, 14,167 rule-cleared, 14,167 abstained and 42,499 built for human review; 3,069.5 operator hours. Estimates, not measured savings or actual decisions.");
    const edited = calculateBaseline({ ...BASELINE_DEFAULTS, volume: 12 });
    expect(baselineSummary(edited, true)).toContain("2 pharmacy-caught, 2 rule-cleared, 2 abstained and 6 built");
    expect(baselineSummary(edited, false)).toBe("Manual scenario: 12 items, 1.4 operator hours. Agent Off: With agent estimates hidden; no measured saving is claimed.");
  });
});

describe("baseline validation", () => {
  it.each(["1.0000000000000001", "1000000000.00000000001"])("rejects fractional volume before numeric precision can hide its fraction: %s", (volume) => {
    expect(parseBaselineDraft({ ...baselineDraft(BASELINE_DEFAULTS), volume }, 35).input).toBeNull();
  });
  for (const field of BASELINE_FIELDS) {
    it(`rejects exact decimals just above ${field.key}'s limit before rounding`, () => {
      for (const text of [`${field.max}.00000000000000001`, `000${field.max}.${"0".repeat(400)}1`]) {
        const draft = { ...baselineDraft(BASELINE_DEFAULTS), [field.key]: text };
        const parsed = parseBaselineDraft(draft, 35);
        expect(parsed.input).toBeNull();
        expect(parsed.errors[field.key]).toBeDefined();
        expect(draft[field.key]).toBe(text);
      }
    });
    it(`retains inclusive zero/max bounds and rejects huge raw ${field.key} inputs`, () => {
      for (const text of ["0", String(field.max), `000${field.max}`, ...(field.integer ? [] : [`${field.max}.00000000000000000`, `${field.max - 1}.99999999999999999`, ".00000000000000001"])]) {
        const parsed = parseBaselineDraft({ ...baselineDraft(BASELINE_DEFAULTS), [field.key]: text }, 35);
        expect(parsed.errors).toEqual({});
        expect(parsed.input?.[field.key]).toBe(Number(text));
      }
      expect(parseBaselineDraft({ ...baselineDraft(BASELINE_DEFAULTS), [field.key]: "9".repeat(10_000) }, 35).errors[field.key]).toBeDefined();
      expect(field.hint).toContain(`0 to ${field.max.toLocaleString("en-GB")}`);
    });
    it.each(["", " ", "-1", "NaN", "Infinity", "-Infinity", "1e309", "0x10", "1,000", "abc", String(field.max + 1)])(`rejects ${field.key}=%s without substituting stale/default results`, (text) => {
      const parsed = parseBaselineDraft({ ...baselineDraft(BASELINE_DEFAULTS), [field.key]: text }, 35);
      expect(parsed.input).toBeNull();
      expect(parsed.errors[field.key]).toBeDefined();
    });
  }
  it.each(["gatheringMinutes", "judgingMinutes"] as const)("keeps values just above 60 valid for %s: the limit is 1,440 minutes", (key) => {
    expect(parseBaselineDraft({ ...baselineDraft(BASELINE_DEFAULTS), [key]: "60.00000000000000001" }, 35).errors).toEqual({});
  });
  it.each(Object.keys(BASELINE_DEFAULTS) as (keyof BaselineInputs)[])("rejects unsafe programmatic %s", (key) => {
    for (const value of [-1, NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
      expect(() => calculateBaseline({ ...BASELINE_DEFAULTS, [key]: value })).toThrow(RangeError);
    }
  });
});

describe("calculator session slice", () => {
  beforeEach(() => useAppStore.getState().resetDemo());
  it("updates only calculator inputs; the assistance flag and immutable history do not change", () => {
    const before = useAppStore.getState();
    before.setBaselineInput("volume", "123");
    before.setBaselineInput("gatheringMinutes", "");
    const after = useAppStore.getState();
    expect(after.baselineInputs.volume).toBe("123");
    expect(after.baselineInputs.gatheringMinutes).toBe("");
    expect(after.records).toBe(before.records);
    expect(after.caseStates).toBe(before.caseStates);
    expect(after.agentEnabled).toBe(before.agentEnabled);
  });
  it("turning off preserves inputs/history; demo reset restores all defaults and flag", () => {
    const store = useAppStore.getState();
    store.setBaselineInput("volume", "0");
    store.setAgentEnabled(false);
    expect(useAppStore.getState().baselineInputs.volume).toBe("0");
    expect(useAppStore.getState().records).toBe(store.records);
    store.resetDemo();
    expect(useAppStore.getState().baselineInputs).toEqual(baselineDraft(BASELINE_DEFAULTS));
    expect(useAppStore.getState().agentEnabled).toBe(true);
    expect(useAppStore.getState().records.map((r) => r.id)).toEqual(["DR-000871"]);
  });
});