import { beforeEach, describe, expect, it, vi } from "vitest";
import { BASELINE_FIELDS, GATHERING_STEPS, baselineDraft, baselineSummary, calculateBaseline, parseBaselineDraft, selectBaselineScenario, manualGatheringMinutes, BASELINE_DEFAULTS, BASELINE_VOLUME_REFERENCE, baselineDefaultCopy, referralFreeProxyDisplay, type BaselineInputs } from "../../src/lib/domain/baseline";
import { BASELINE_PROVENANCE } from "../../src/lib/domain/baseline-defaults";
import { CASES, QUEUE_FILLER } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { SOURCE_CLAIMS } from "../../data/reference/source-audit";
import { useAppStore } from "../../src/lib/store";
import { PUBLIC_FACTS, TOUR_CONTENT } from "../../src/lib/domain/public-facts";

describe("baseline source and synthetic default provenance", () => {
  it("pins three public process figures: automatic pricing, staff touch and monthly referrals", () => {
    expect(PUBLIC_FACTS).toMatchObject({ annualItems: 1_100_000_000, monthlyReferrals: 85_000, rulebookPublication: "Monthly" });
    expect(TOUR_CONTENT.keyFigures.map(({ id, value }) => ({ id, value }))).toEqual([
      { id: "automated-items", value: "Most items" },
      { id: "staff-touch", value: "Approximately 4%" },
      { id: "monthly-referrals", value: "Approximately 85,000" },
    ]);
    expect(JSON.stringify(TOUR_CONTENT.keyFigures)).not.toMatch(/99\.85|100%|accuracy-target/);
    expect(BASELINE_DEFAULTS.volume).toBe(PUBLIC_FACTS.monthlyReferrals);
  });

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
    expect(baselineDefaultCopy(BASELINE_DEFAULTS).volumeContext).toContain("1,000,000 annual referrals / 12 = approximately 83,333.33 monthly, not exactly 85,000");
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
    expect(result.manualGatheringMinutes).toBe(5);
    expect(result.withAgent).toEqual({ gatheringMinutes: 113_334, judgingMinutes: 170_000, operatorHours: 283_334 / 60 });
    expect(result.builtBeforeDecisionMinutes).toBe(3 + BASELINE_DEFAULTS.assemblySeconds / 60);
    expect(result.abstainBeforeDecisionMinutes).toBe(7);
    const slow = calculateBaseline({ ...BASELINE_DEFAULTS, assemblySeconds: 3600 });
    expect(slow.today).toEqual(result.today);
    expect(slow.withAgent).toEqual(result.withAgent);
    expect(slow.builtBeforeDecisionMinutes).toBe(63);
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
            const result = calculateBaseline({ ...BASELINE_DEFAULTS, volume, precheckPercent: p, clearedPercent: c, abstainPercent: a, findFormMinutes: 1440, judgingMinutes: 1440 });
            const counts = [result.pharmacyCaught, result.cleared, result.abstained, result.built];
            expect(counts.every((n) => Number.isSafeInteger(n) && n >= 0 && n <= volume)).toBe(true);
            expect(counts.reduce((sum, n) => sum + n, 0)).toBe(volume);
            expect(Number.isFinite(result.today.operatorHours)).toBe(true);
            expect(result.withAgent.operatorHours).toBeLessThanOrEqual(result.today.operatorHours);
            expect(result.withAgent.judgingMinutes).toBe(result.today.judgingMinutes);
            expect(result.referrals.withAgent).toBeLessThanOrEqual(result.built + result.abstained);
            expect(result.referrals.withAgent).toBeGreaterThanOrEqual(0);
            expect(Number.isSafeInteger(result.referrals.withAgent)).toBe(true);
            expect(result.referralRiskResidual).toBe(result.abstained + result.referrals.built);
            expect(result.referralRiskResidual).toBeLessThanOrEqual(volume);
            if (volume === 0 || result.referralRiskResidual === 0) expect(result.referralFreeProxyPercent).toBeNull();
            else {
              expect(result.referralFreeProxyPercent).toBeGreaterThanOrEqual(0);
              expect(result.referralFreeProxyPercent).toBeLessThan(100);
              expect(referralFreeProxyDisplay(result)).not.toBe("100%");
            }
          }
        }
      }
    }
  });

  it("accepts fractional minutes and rates, but never fractional item volumes", () => {
    const draft = { ...baselineDraft(BASELINE_DEFAULTS), findFormMinutes: ".25", judgingMinutes: "2.5", precheckPercent: "12.125" };
    expect(parseBaselineDraft(draft, 35).input).toMatchObject({ findFormMinutes: 0.25, judgingMinutes: 2.5, precheckPercent: 12.125 });
    expect(parseBaselineDraft({ ...draft, volume: "1.1" }, 35).errors.volume).toBeDefined();
  });

  it("generates all cohorts from the result and hides assisted estimates when off", () => {
    const result = calculateBaseline(BASELINE_DEFAULTS);
    expect(baselineSummary(result, true)).toBe("Synthetic scenario: 14,167 pharmacy-caught, 14,167 cleared, 14,167 abstained, 42,499 built; 17,709 referrals. Judging unchanged. Not measured savings or decisions.");
    const edited = calculateBaseline({ ...BASELINE_DEFAULTS, volume: 12 });
    expect(baselineSummary(edited, true)).toContain("2 pharmacy-caught, 2 cleared, 2 abstained, 6 built");
    expect(baselineSummary(edited, false)).toBe("Synthetic scenario: 12 items; 1.4 reference hours. Assisted estimates hidden. No measured savings.");
    for (const enabled of [true, false]) console.info("Advisory word count / budget 25:", baselineSummary(result, enabled).split(/\s+/).length);
  });

  it.each(GATHERING_STEPS)("$key independently changes the seven-step total and both gathering calculations", ({ key }) => {
    const before = calculateBaseline({ ...BASELINE_DEFAULTS, volume: 12 });
    const input = { ...BASELINE_DEFAULTS, volume: 12, [key]: BASELINE_DEFAULTS[key] + 1.25 };
    const after = calculateBaseline(input);
    expect(after.manualGatheringMinutes).toBe(6.25);
    expect(after.today.gatheringMinutes - before.today.gatheringMinutes).toBe(12 * 1.25);
    expect(after.withAgent.gatheringMinutes - before.withAgent.gatheringMinutes).toBe(2 * 1.25);
    expect(after.today.judgingMinutes).toBe(before.today.judgingMinutes);
    expect(after.withAgent.judgingMinutes).toBe(after.today.judgingMinutes);
    expect(selectBaselineScenario(baselineDraft(input)).result).toEqual(after);
  });

  it("built review is editable, defaults to one minute and can exceed manual gathering without clamping", () => {
    expect(BASELINE_DEFAULTS.builtReviewMinutes).toBe(1);
    const input = { ...BASELINE_DEFAULTS, volume: 12, precheckPercent: 0, clearedPercent: 0, abstainPercent: 0, builtReviewMinutes: 10 };
    const result = calculateBaseline(input);
    expect(result.withAgent.gatheringMinutes).toBe(120);
    expect(result.withAgent.operatorHours).toBeGreaterThan(result.today.operatorHours);
    expect(result.withAgent.judgingMinutes).toBe(result.today.judgingMinutes);
  });

  it("judging remains V*j on both sides even if pharmacy catches everything", () => {
    for (const judgingMinutes of [0, 0.25, 3.75, 1440]) {
      const result = calculateBaseline({ ...BASELINE_DEFAULTS, volume: 12, precheckPercent: 100, judgingMinutes });
      expect(result.withAgent.judgingMinutes).toBe(12 * judgingMinutes);
      expect(result.withAgent.judgingMinutes).toBe(result.today.judgingMinutes);
      expect(result.withAgent.gatheringMinutes).toBe(0);
    }
  });

  it("referrals round each disjoint deficiency cohort halves up, never all exceptions or actual accuracy", () => {
    const input = { ...BASELINE_DEFAULTS, volume: 12 };
    const result = calculateBaseline(input);
    expect(result.referrals).toEqual({ today: 12, withAgent: 3, built: 2, abstained: 1 });
    expect(result.referralRiskResidual).toBe(4);
    expect(result.referralFreeProxyPercent).toBe(8 / 12 * 100);
    expect(referralFreeProxyDisplay(result)).toBe("66.6%");
    for (const deficientBuiltPercent of [0, 0.5, 25, 50, 99.9999, 100]) {
      for (const deficientAbstainPercent of [0, 0.5, 50, 100]) {
        const r = calculateBaseline({ ...input, deficientBuiltPercent, deficientAbstainPercent });
        expect(r.referrals.built).toBe(Math.round(r.built * deficientBuiltPercent / 100));
        expect(r.referrals.abstained).toBe(Math.round(r.abstained * deficientAbstainPercent / 100));
        expect(r.referrals.withAgent).toBe(r.referrals.built + r.referrals.abstained);
        expect(r.referrals.withAgent).toBeLessThanOrEqual(r.built + r.abstained);
      }
    }
    const allBuilt = { ...input, precheckPercent: 0, clearedPercent: 0, abstainPercent: 0 };
    expect(calculateBaseline({ ...allBuilt, deficientBuiltPercent: 100 }).referralFreeProxyPercent).toBe(0);
    expect(calculateBaseline({ ...allBuilt, deficientBuiltPercent: 0 }).referralFreeProxyPercent).toBeNull();
    expect(calculateBaseline({ ...input, volume: 0 }).referralFreeProxyPercent).toBeNull();
  });

  it("keeps every abstention in residual risk without double-counting deficient abstentions", () => {
    const input = { ...BASELINE_DEFAULTS, volume: 12, deficientBuiltPercent: 0 };
    const none = calculateBaseline({ ...input, deficientAbstainPercent: 0 });
    const all = calculateBaseline({ ...input, deficientAbstainPercent: 100 });
    expect(none.referrals.withAgent).toBe(0);
    expect(all.referrals.withAgent).toBe(2);
    expect(none.referralRiskResidual).toBe(2);
    expect(all.referralRiskResidual).toBe(2);
    expect(none.referralFreeProxyPercent).toBe(all.referralFreeProxyPercent);
  });

  it("zero residual and zero volume never establish accuracy; tiny positive residual never rounds to 100", () => {
    const input = { ...BASELINE_DEFAULTS, precheckPercent: 0, clearedPercent: 0, abstainPercent: 0, deficientBuiltPercent: 0 };
    for (const volume of [0, 1, 12, 85_000, 1_000_000_000]) {
      const empty = calculateBaseline({ ...input, volume });
      expect(empty.referralRiskResidual).toBe(0);
      expect(empty.referralFreeProxyPercent).toBeNull();
      expect(referralFreeProxyDisplay(empty)).toBe("Not established");
    }
    const tiny = calculateBaseline({ ...input, volume: 1_000_000_000, deficientBuiltPercent: 0.0000001 });
    expect(tiny.referralRiskResidual).toBe(1);
    expect(tiny.referralFreeProxyPercent).toBeLessThan(100);
    expect(referralFreeProxyDisplay(tiny)).toBe("99.9%");
  });

  it("shared scene/calculator selector has no separate values or stale invalid fallback", () => {
    expect(GATHERING_STEPS).toHaveLength(7);
    expect(manualGatheringMinutes(BASELINE_DEFAULTS)).toBe(5);
    const draft = baselineDraft(BASELINE_DEFAULTS);
    for (const { key } of BASELINE_FIELDS) {
      const changed = { ...draft, [key]: "0" };
      const scenario = selectBaselineScenario(changed);
      expect(scenario.result).toEqual(calculateBaseline({ ...BASELINE_DEFAULTS, [key]: 0 }));
      expect(selectBaselineScenario({ ...draft, [key]: "" }).result).toBeNull();
    }
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
  it.each([...GATHERING_STEPS.map(({ key }) => key), "builtReviewMinutes", "judgingMinutes"] as const)("keeps values just above 60 valid for %s: the limit is 1,440 minutes", (key) => {
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
    before.setBaselineInput("findFormMinutes", "");
    const after = useAppStore.getState();
    expect(after.baselineInputs.volume).toBe("123");
    expect(after.baselineInputs.findFormMinutes).toBe("");
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
    expect(useAppStore.getState().agentEnabled).toBe(false);
    expect(useAppStore.getState().records.map((r) => r.id)).toEqual(["DR-000871"]);
  });
});