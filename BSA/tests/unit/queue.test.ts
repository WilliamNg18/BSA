import { afterEach, describe, expect, it, vi } from "vitest";
import { BASELINE_DEFAULTS, calculateBaseline, manualGatheringMinutes } from "../../src/lib/domain/baseline";
import { CASES, QUEUE_FILLER } from "../../src/lib/domain/cases";
import * as agent from "../../src/lib/domain/agent";
import { DAY_MINUTES, QUEUE_ROW_HEIGHT, QUEUE_SEGMENT_SIZE, QUEUE_WINDOW_LIMIT, QUEUE_SEEDS, SWEEP_PHASES, clampDay, dayClock, projectQueueDay, projectSeedDay, queueCohort, queueWindow, sweepCounts } from "../../src/lib/domain/queue-model";
import { useAppStore } from "../../src/lib/store";
import { useQueueStore } from "../../src/lib/queue-store";

afterEach(() => { vi.restoreAllMocks(); useAppStore.getState().resetDemo(); });

describe("bounded deterministic virtual month", () => {
  it.each([0, 1, 5, 11, 12, 13, 999, 1000, 1001, 85_000, 1_000_000_000])("volume %s has finite segments and bounded slices at start/middle/end", (volume) => {
    const engine = vi.spyOn(agent, "runAgent");
    for (const position of [0, 1, 998, 999, 1000, Math.floor(volume / 2), volume - 1, 1e12]) {
      const window = queueWindow(volume, position);
      expect(window.indices.length).toBeLessThanOrEqual(QUEUE_WINDOW_LIMIT);
      expect(window.height).toBeLessThanOrEqual(QUEUE_SEGMENT_SIZE * QUEUE_ROW_HEIGHT);
      expect(Number.isFinite(window.height)).toBe(true);
      expect(window.indices.every((i) => i >= 0 && i < volume)).toBe(true);
      if (volume) expect(window.indices).toContain(window.current);
      else expect(window.indices).toEqual([]);
    }
    expect(queueWindow(volume, volume - 1).current).toBe(Math.max(0, volume - 1));
    expect(engine).not.toHaveBeenCalled();
  });
  it.each([0, 1, 5, 11, 12, 13, 101, 1003])("cohorts match baseline exactly for %s without seed inflation", (volume) => {
    const result = calculateBaseline({ ...BASELINE_DEFAULTS, volume });
    const counts = { pharmacy: 0, cleared: 0, abstained: 0, built: 0 };
    for (let i = 0; i < volume; i++) {
      const cohort = queueCohort(i, result);
      counts[cohort]++;
      expect(queueCohort(i, result)).toBe(cohort);
    }
    expect(counts).toEqual({ pharmacy: result.pharmacyCaught, cleared: result.cleared, abstained: result.abstained, built: result.built });
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(volume);
    expect(QUEUE_SEEDS).toHaveLength(12);
  });
  it("rejects invalid volumes and out-of-range cohort positions", () => {
    for (const n of [-1, 1e9 + 1, 0.5, Infinity, NaN]) expect(() => queueWindow(n, 0)).toThrow(RangeError);
    const result = calculateBaseline(BASELINE_DEFAULTS);
    for (const n of [-1, result.volume, 0.5, NaN]) expect(() => queueCohort(n, result)).toThrow(RangeError);
  });
  it("billion-item classifications are repeatable and call no engine", () => {
    const engine = vi.spyOn(agent, "runAgent"), result = calculateBaseline({ ...BASELINE_DEFAULTS, volume: 1e9 });
    const positions = [0, 11, 12, 999, 1e8, 1e9 - 1];
    expect(positions.map((i) => queueCohort(i, result))).toEqual(positions.map((i) => queueCohort(i, result)));
    expect(engine).not.toHaveBeenCalled();
  });
});

describe("one budget and the same twelve examples", () => {
  it.each([0, 1, 5, 12, 85_000, 1e9])("day capacity is volume-capped for %s", (volume) => {
    const input = { ...BASELINE_DEFAULTS, volume }, result = calculateBaseline(input);
    for (const time of [0, 1, 15, 60, 270, 540, 999]) {
      const day = projectQueueDay(input, time), budget = Math.min(time, 540);
      expect(day.today.processed).toBe(Math.min(volume, Math.floor(budget / (manualGatheringMinutes(input) + input.judgingMinutes))));
      expect(day.today.gathering + day.today.judging).toBeLessThanOrEqual(budget);
      expect(day.assisted.gathering + day.assisted.review + day.assisted.judging).toBeLessThanOrEqual(budget + 1e-8);
      expect(day.assisted.built).toBeLessThanOrEqual(result.built);
      expect(day.assisted.abstained).toBeLessThanOrEqual(result.abstained);
      expect(day.assisted.processed).toBe(day.assisted.built + day.assisted.abstained);
      expect(day.assisted.processed + day.assisted.awaiting).toBe(result.built + result.abstained);
      expect(day.assisted.processed + day.assisted.cleared + day.assisted.pharmacy).toBeLessThanOrEqual(volume);
    }
  });
  it.each([0, 50, 100])("abstention share %s never gets a second operator budget", (abstainPercent) => {
    const input = { ...BASELINE_DEFAULTS, precheckPercent: 0, clearedPercent: 0, abstainPercent };
    const { assisted } = projectQueueDay(input, 540);
    expect(assisted.review + assisted.gathering + assisted.judging).toBeLessThanOrEqual(540);
    expect(assisted.judging).toBe((assisted.built + assisted.abstained) * input.judgingMinutes);
  });
  it("rule-cleared and pharmacy-caught items have no review or judgement", () => {
    for (const input of [{ ...BASELINE_DEFAULTS, clearedPercent: 100 }, { ...BASELINE_DEFAULTS, precheckPercent: 100 }]) {
      const day = projectQueueDay(input, 540);
      expect(day.assisted.processed).toBe(0);
      expect(day.assisted.gathering + day.assisted.review + day.assisted.judging).toBe(0);
      expect(day.assisted.cleared + day.assisted.pharmacy).toBe(input.volume);
      expect(calculateBaseline(input).withAgent.judgingMinutes).toBe(input.volume * input.judgingMinutes);
    }
  });
  it("zero-minute assumptions stay finite and bounded", () => {
    const input = { ...BASELINE_DEFAULTS, findFormMinutes: 0, readEndorsementMinutes: 0, productPackMinutes: 0, claimRecordsMinutes: 0, tariffVersionClauseMinutes: 0, compareSourcesMinutes: 0, recordReasonMinutes: 0, judgingMinutes: 0, builtReviewMinutes: 0 };
    expect(projectQueueDay(input, 0).today.processed).toBe(0);
    expect(projectQueueDay(input, 540).today.processed).toBe(input.volume);
    const day = projectQueueDay(input, 540);
    expect(day.assisted.processed + day.assisted.cleared + day.assisted.pharmacy).toBe(input.volume);
    expect(day.assisted.judging + day.assisted.review + day.assisted.gathering).toBe(0);
  });
  it("clock boundaries and all seeds stay consistent in both comparisons", () => {
    expect(dayClock(0)).toBe("08:00"); expect(dayClock(540)).toBe("17:00");
    expect(dayClock(Infinity)).toBe("08:00"); expect(clampDay(-1)).toBe(0);
    for (const enabled of [false, true]) {
      const day = projectSeedDay(BASELINE_DEFAULTS, 540, enabled);
      expect(day.map((s) => s.id)).toEqual([...CASES, ...QUEUE_FILLER].map((s) => s.id));
      expect(day[3]).toMatchObject({ kind: "abstained", gather: 5, judge: 2 });
      expect(day[4]).toMatchObject({ kind: "cleared", gather: 0, judge: 0, done: false, phase: "Existing code; no agent" });
      expect(day[5]).toMatchObject({ recorded: true, gather: 0, judge: 0, done: false });
      expect(day[1].gather).toBe(enabled ? BASELINE_DEFAULTS.builtReviewMinutes : 5);
    }
    expect(projectSeedDay(BASELINE_DEFAULTS, 540, true, [CASES[1].id])[1]).toMatchObject({ recorded: true, done: false, gather: 0, judge: 0 });
  });
});

describe("presentation-only queue memory", () => {
  it("publishes presentation changes without writing actual cases, records, lifecycle or receipts", () => {
    const store = useAppStore.getState(), fixture = structuredClone(CASES);
    const events = vi.fn(), unsubscribe = useAppStore.subscribe(events);
    const state = useQueueStore.getState();
    state.jump(1e9 - 1); state.startSweep(QUEUE_SEEDS.map((s) => ({ key: s.id, kind: s.kind })));
    for (let i = 0; i < 10; i++) state.stepSweep();
    state.play(true); state.tickDay(); state.setDay(DAY_MINUTES);
    projectQueueDay(BASELINE_DEFAULTS, 540); projectSeedDay(BASELINE_DEFAULTS, 540, true);
    state.cancel(); state.reset();
    expect(useAppStore.getState().records).toBe(store.records);
    expect(useAppStore.getState().caseStates).toBe(store.caseStates);
    expect(useAppStore.getState().lifecycles).toBe(store.lifecycles);
    expect(events).toHaveBeenCalled();
    for (const [next, previous] of events.mock.calls) {
      const { queue: nextQueue, ...nextDomain } = next;
      const { queue: previousQueue, ...previousDomain } = previous;
      expect(nextQueue).not.toBe(previousQueue);
      expect(nextDomain).toEqual(previousDomain);
      for (const field of Object.keys(nextDomain)) expect(nextDomain[field]).toBe(previousDomain[field]);
    }
    expect(CASES).toEqual(fixture);
    unsubscribe();
  });
  it("bounds stored sweep rows and stops exactly at hand-off", () => {
    const state = useQueueStore.getState(), items = Array.from({ length: 100 }, (_, i) => ({ key: String(i), kind: "built" as const }));
    state.startSweep(items); items[0].key = "changed";
    expect(useQueueStore.getState().sweep).toHaveLength(32);
    expect(useQueueStore.getState().sweep[0].key).toBe("0");
    for (let i = 0; i < 20; i++) state.stepSweep();
    expect(useQueueStore.getState()).toMatchObject({ phase: SWEEP_PHASES.length - 1, sweeping: false });
    expect(sweepCounts(["cleared", "abstained", "built", "recorded", "pharmacy"])).toEqual({ built: 1, cleared: 1, abstained: 1, awaiting: 2 });
  });
  it("Off cancels a pending sweep without changing records", () => {
    useAppStore.getState().setAgentEnabled(true);
    useQueueStore.getState().startSweep([{ key: "D", kind: "abstained" }]);
    const records = useAppStore.getState().records;
    useAppStore.getState().setAgentEnabled(false);
    useQueueStore.getState().stepSweep();
    expect(useQueueStore.getState()).toMatchObject({ sweeping: false, phase: -1, sweep: [] });
    expect(useAppStore.getState().records).toBe(records);
  });
  it.each(["inputs", "reset"])("%s clears bounded queue state through the existing adapter", (action) => {
    const state = useQueueStore.getState(); state.jump(999); state.setDay(300); state.play(true); state.startSweep([{ key: "A", kind: "built" }]);
    const revision = useQueueStore.getState().revision;
    if (action === "inputs") useAppStore.getState().setBaselineInput("volume", "5");
    else useAppStore.getState().resetDemo();
    expect(useQueueStore.getState()).toMatchObject({ position: 0, day: 0, playing: false, sweep: [], phase: -1, sweeping: false, revision: revision + 1 });
  });
  it("pause and step stay deterministic without timers or persisted history", () => {
    const state = useQueueStore.getState(); state.reset(); state.play(true); state.tickDay();
    expect(useQueueStore.getState().day).toBe(15);
    state.play(false); state.tickDay(); expect(useQueueStore.getState().day).toBe(15);
    state.setDay(540); state.play(true); state.tickDay(); expect(useQueueStore.getState()).toMatchObject({ day: 540, playing: false });
  });
});