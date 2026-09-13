import { afterEach, describe, expect, it } from "vitest";
import { ASSISTED_SLOTS, manualChoice, permitsProposal, traceSlotReady } from "../../src/lib/case-presentation";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { BASELINE_DEFAULTS, GATHERING_STEPS, manualGatheringMinutes } from "../../src/lib/domain/baseline";
import { useAppStore } from "../../src/lib/store";

afterEach(() => useAppStore.getState().resetDemo());

describe("Task 6 read-only presentation", () => {
  it("derives seven synthetic gathering durations and their exact sum", () => {
    expect(GATHERING_STEPS).toHaveLength(7);
    expect(manualGatheringMinutes(BASELINE_DEFAULTS)).toBe(5);
    expect(manualGatheringMinutes({ ...BASELINE_DEFAULTS, findFormMinutes: 2 })).toBe(6.5);
  });

  for (const c of CASES) {
    it(`${c.scenario}: Off has NONE and no assisted slots; canonical result is untouched`, () => {
      const original = JSON.stringify(c);
      const off = runAgent(c, { agentEnabled: false });
      expect(off.recommendation).toBe("NONE");
      expect(off.agentInvoked).toBe(false);
      expect(permitsProposal(off)).toBe(false);
      for (const slot of ASSISTED_SLOTS) expect(traceSlotReady(off, 99, slot)).toBe(false);
      const on = runAgent(c);
      expect(on.recommendation).toBe(({ A: "NONE", B: "REFER_BACK", C: "REQUEST_INFORMATION", D: "ABSTAIN", E: "NONE", F: "REFER_BACK" })[c.scenario]);
      expect(JSON.stringify(c)).toBe(original);
    });
  }

  for (const c of CASES.slice(1, 3)) {
    it(`${c.scenario}: slots follow actual phases and FAIL never fills them`, () => {
      const pack = runAgent(c);
      const snapshot = JSON.stringify(pack);
      for (let n = 0; n <= pack.trace.length; n++) {
        expect(traceSlotReady(pack, n, "Clause")).toBe(n >= 4);
        expect(traceSlotReady(pack, n, "Requirements")).toBe(n >= 6);
        expect(traceSlotReady(pack, n, "Confidence")).toBe(n >= 6);
        expect(traceSlotReady(pack, n, "Alternative")).toBe(n >= 8);
      }
      expect(JSON.stringify(pack)).toBe(snapshot);
      const failed = runAgent({ ...c, extracted: { ...c.extracted, prescriber: "Illegible" } });
      expect(failed.gate.result).toBe("FAIL");
      expect(failed.recommendation).toBe("NONE");
      expect(failed.alternative).toBeNull();
      expect(failed.draftToPharmacy).toBeNull();
      for (const slot of ASSISTED_SLOTS) expect(traceSlotReady(failed, 99, slot)).toBe(false);
    });
  }

  it("retains D's three abstention reasons, five signals and NOT_RUN gate", () => {
    const pack = runAgent(CASES[3]);
    expect(pack.abstainReasons).toHaveLength(3);
    expect(pack.gate.result).toBe("NOT_RUN");
    expect(pack.signals).toMatchObject({ provisionFound: false, imageQuality: 0.31, inCoverage: false, sampleAgreement: { agree: 1, total: 3 } });
    expect(Object.keys(pack.signals)).toHaveLength(5);
    for (const slot of ASSISTED_SLOTS) expect(traceSlotReady(pack, 99, slot)).toBe(false);
  });

  it("never auto-selects sufficient; records an explicit manual ACCEPT after queue arrival without a false override", () => {
    expect(manualChoice(null)).toBe("ESCALATE");
    expect(manualChoice("AMEND")).toBe("ESCALATE");
    expect(manualChoice("ACCEPT")).toBe("ACCEPT");
    const before = useAppStore.getState();
    before.submitFromPharmacy(CASES[1].id, CASES[1].extracted.endorsementText);
    before.arriveInQueue(CASES[1].id);
    const record = before.recordDecision({ caseId: CASES[1].id, tariffVersion: "n/a", agentVersion: "not invoked", inputs: ["Synthetic captured form"], sources: ["Existing capture"], checks: [], recommendation: "NONE", decision: "ACCEPT", overrideReason: "Human judgement on the captured evidence" });
    expect(record).toMatchObject({ recommendation: "NONE", decision: "ACCEPT", isOverride: false, tariffVersion: "n/a", checks: [] });
    expect(record.overrideReason).toBeTruthy();
    expect(useAppStore.getState().records).toHaveLength(before.records.length + 1);
    expect(useAppStore.getState().lifecycles[CASES[1].id]).toMatchObject({ state: "paid", history: expect.arrayContaining([expect.objectContaining({ actor: "operator", recordId: record.id, revision: 2 })]) });
  });

  it("July B counterfactual never rewrites recorded August history or state", () => {
    const before = useAppStore.getState();
    const snapshot = JSON.stringify(before.records);
    expect(runAgent(CASES[1], { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
    expect(runAgent(CASES[1]).recommendation).toBe("REFER_BACK");
    expect(JSON.stringify(useAppStore.getState().records)).toBe(snapshot);
    expect(useAppStore.getState().caseStates).toBe(before.caseStates);
  });
});