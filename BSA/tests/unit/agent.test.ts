import { beforeEach, describe, expect, it } from "vitest";
import { runAgent } from "../../src/lib/domain/agent";
import { CASES } from "../../src/lib/domain/cases";
import { useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("six synthetic outcomes", () => {
  it.each([
    ["A", "NONE", "NOT_RUN", "high", "cleared_by_rules"],
    ["B", "REFER_BACK", "PASS", "high", "operator_review_required"],
    ["C", "REQUEST_INFORMATION", "PASS", "medium", "additional_evidence_required"],
    ["D", "ABSTAIN", "NOT_RUN", "abstain", "agent_abstained"],
    ["E", "NONE", "NOT_RUN", "high", "cleared_by_rules"],
    ["F", "REFER_BACK", "PASS", "high", "operator_review_required"],
  ])("pins case %s", (scenario, recommendation, gate, composite, state) => {
    const c = CASES.find((item) => item.scenario === scenario)!;
    const before = structuredClone(c);
    const pack = runAgent(c);
    expect(pack).toMatchObject({ recommendation, gate: { result: gate }, composite: { level: composite }, state, tariffVersion: "2026-08" });
    expect(c).toEqual(before);
    expect(runAgent(c)).toEqual(pack);
  });

  it("B changes only the rule under July replay, retaining the original evidence", () => {
    const c = CASES[1];
    const august = runAgent(c);
    const july = runAgent(c, { tariffVersion: "2026-07" });
    expect(july).toMatchObject({ recommendation: "SUFFICIENT", gate: { result: "PASS" }, tariffVersion: "2026-07" });
    expect(july.facts).toEqual(august.facts);
    expect(august.requirementResults.find((r) => r.requirement.id === "dated")?.met).toBe(false);
    expect(july.requirementResults.map((r) => r.requirement.id)).toEqual(["endorsement_present", "initialled"]);
    expect(august.alternative?.note).toContain("Not permitted");
    expect(august.draftToPharmacy).toContain("Please add the date beside the initials");
  });

  it("C surfaces both quantities without resolving either source", () => {
    const pack = runAgent(CASES[2]);
    expect(pack.conflicts).toHaveLength(1);
    expect(pack.conflicts[0]).toMatchObject({ field: "Quantity", material: true, values: [
      { origin: "Form image (capture)", value: "56" },
      { origin: "Claim message / ledger", value: "84" },
    ] });
    expect(CASES[2].extracted.quantity).toBe(56);
    expect(CASES[2].claim.quantity).toBe(84);
  });

  it("D names all three stop conditions and never drafts a recommendation", () => {
    const pack = runAgent(CASES[3]);
    expect(pack.abstainReasons).toEqual([
      "No governing provision could be retrieved for this endorsement type and date",
      "Image quality 0.31 is below the 0.60 threshold",
      "Only 1 of 3 readings agree",
    ]);
    expect(pack.gate.result).toBe("NOT_RUN");
    expect(pack.facts).toBeNull();
    expect(pack.clause).toBeNull();
    expect(pack.draftToPharmacy).toBeNull();
    expect(pack.trace.some((s) => s.phase === "RECOMMEND")).toBe(false);
  });

  it.each([CASES[0], CASES[4]])("$scenario stops at pure pre-checks, without an agent step or model call", (c) => {
    const records = useAppStore.getState().records;
    const pack = runAgent(c);
    expect(pack.agentInvoked).toBe(false);
    expect(pack.trace.map((s) => s.phase)).toEqual(["PLAN", "HAND_OFF"]);
    expect(pack.trace.every((s) => s.cls === "deterministic")).toBe(true);
    expect(pack.trace.flatMap((s) => s.toolCalls).map((t) => t.tool)).toEqual(["lookup_product_pack", "lookup_claim"]);
    expect(useAppStore.getState().records).toBe(records);
  });

  it("F remains decided in session state with its pinned seeded record", () => {
    runAgent(CASES[5]);
    expect(useAppStore.getState().caseStates["EX-24088"]).toBe("human_decision_recorded");
    expect(useAppStore.getState().records).toEqual([expect.objectContaining({
      id: "DR-000871", caseId: "EX-24088", tariffVersion: "2026-08",
      recommendation: "REFER_BACK", decision: "REFER_BACK", isOverride: false, synthetic: true,
    }), expect.objectContaining({
      id: "DR-000872", caseId: "EX-24088", revision: 2, decision: "ACCEPT",
      recommendation: "NONE", synthetic: true,
    })]);
  });
});

describe("governance and fail-open paths", () => {
  it.each(CASES)("flag off leaves $scenario state and records unchanged, including July replay", (c) => {
    const states = useAppStore.getState().caseStates;
    const records = useAppStore.getState().records;
    useAppStore.getState().setAgentEnabled(false);
    for (const tariffVersion of [undefined, "2026-07"]) {
      const pack = runAgent(c, { agentEnabled: false, tariffVersion });
      expect(pack).toMatchObject({ agentInvoked: false, recommendation: "NONE", state: c.initialState, gate: { result: "NOT_RUN" } });
      expect(pack.evidence.length).toBeGreaterThan(0);
      expect(pack.trace.some((step) => step.cls === "agent")).toBe(false);
    }
    expect(useAppStore.getState().caseStates).toBe(states);
    expect(useAppStore.getState().records).toBe(records);
  });

  it("records a human decision append-only and Reset restores the seed", () => {
    const store = useAppStore.getState();
    const originalRecords = store.records;
    const originalStates = store.caseStates;
    store.setAgentEnabled(true);
    store.submitItem({ caseId: CASES[1].id, channel: "eps", endorsementText: CASES[1].extracted.endorsementText });
    store.arriveInQueue(CASES[1].id);
    const pack = runAgent(CASES[1]);
    const record = store.recordDecision({ caseId: CASES[1].id, tariffVersion: pack.tariffVersion,
      agentVersion: pack.agentVersion, inputs: [], sources: [], checks: pack.gate.checks,
      recommendation: pack.recommendation, decision: "ESCALATE", overrideReason: "Senior review required" });
    expect(record).toMatchObject({ isOverride: true, overrideReason: "Senior review required" });
    expect(originalRecords).toHaveLength(2);
    expect(useAppStore.getState().records).toEqual([...originalRecords, record]);
    store.setAgentEnabled(false);
    store.resetDemo();
    expect(useAppStore.getState().records).toEqual(originalRecords);
    expect(useAppStore.getState().agentEnabled).toBe(false);
    expect(useAppStore.getState().caseStates).toEqual(originalStates);
  });

  it("keeps the observable sequence and the compliance gate deterministic", () => {
    const pack = runAgent(CASES[2]);
    expect(pack.trace.map((s) => s.phase)).toEqual(["PLAN", "PLAN", "GATHER", "RETRIEVE", "RECONCILE", "ASSESS", "RECOMMEND", "CHECK", "HAND_OFF"]);
    expect(pack.trace.find((s) => s.phase === "CHECK")?.cls).toBe("deterministic");
    expect(pack.trace.at(-1)?.cls).toBe("human");
  });

  it.each(CASES.slice(1, 3).flatMap((c) => ["2026-08", "2026-07"].map((tariffVersion) => ({ c, tariffVersion }))))(
    "withholds $c.scenario advice from every consumer under $tariffVersion on gate FAIL",
    ({ c: original, tariffVersion }) => {
    const before = structuredClone(original);
    const baseline = runAgent(original, { tariffVersion });
    expect(baseline.gate.result).toBe("PASS");
    expect(baseline.recommendation).not.toBe("NONE");
    const states = useAppStore.getState().caseStates;
    const records = useAppStore.getState().records;
    const c = structuredClone(original);
    c.extracted.prescriber = "Illegible";
    const pack = runAgent(c, { tariffVersion });
    expect(pack).toMatchObject({ gate: { result: "FAIL" }, state: "operator_review_required",
      recommendation: "NONE", alternative: null, draftToPharmacy: null,
      reasons: ["Recommendation withheld by the compliance gate; evidence only."] });
    expect(pack.gate.checks).toContainEqual(expect.objectContaining({ name: "Mandatory fields present", pass: false }));
    expect(pack.evidence).toEqual(baseline.evidence);
    expect(pack.requirementResults).toEqual(baseline.requirementResults);
    expect(pack.conflicts).toEqual(baseline.conflicts);
    expect(pack.signals).toEqual(baseline.signals);
    expect(pack.trace.map((step) => step.phase)).toEqual(baseline.trace.map((step) => step.phase));
    const withheld = pack.trace.find((step) => step.phase === "RECOMMEND");
    expect(withheld).toMatchObject({ title: "Proposal withheld by the compliance gate", status: "fail", items: [], toolCalls: [] });
    for (const reason of baseline.reasons) expect(JSON.stringify(pack.trace)).not.toContain(reason);
    if (baseline.draftToPharmacy) expect(JSON.stringify(pack)).not.toContain(baseline.draftToPharmacy);
    expect(pack.trace.at(-1)?.summary).toMatch(/recommendation, alternative and draft are withheld/i);
    expect(useAppStore.getState().caseStates).toBe(states);
    expect(useAppStore.getState().records).toBe(records);
    expect(original).toEqual(before);
    expect(runAgent(original, { tariffVersion })).toEqual(baseline);
  });

  it("cannot retrieve a rule for an unknown replay version", () => {
    const pack = runAgent(CASES[1], { tariffVersion: "2099-01" });
    expect(pack.clause).toBeNull();
    expect(pack.recommendation).toBe("ABSTAIN");
  });
});