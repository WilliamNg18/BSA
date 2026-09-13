import { beforeEach, expect, it } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { checkPharmacy, pharmacyDateCorrection, pharmacySnapshot } from "../../src/lib/domain/pharmacy-check";
import { sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
const B = CASES[1];
beforeEach(() => store().resetDemo());
function input() {
  const pack = runAgent(sessionCase(B.id)!);
  return { caseId: B.id, tariffVersion: pack.tariffVersion, agentVersion: pack.agentVersion,
    inputs: pack.evidence.map((e) => e.value), sources: pack.evidence.map((e) => e.origin), checks: pack.gate.checks,
    recommendation: pack.recommendation, decision: "REFER_BACK" as const, overrideReason: "Human checked the missing date" };
}

it("recordDecision accepts only explicit human draft approval and links it exactly once", () => {
  store().submitFromPharmacy(B.id, B.extracted.endorsementText);
  store().arriveInQueue(B.id);
  store().setAgentEnabled(true);
  const pack = runAgent(sessionCase(B.id)!);
  expect(store().lifecycles[B.id].history.at(-1)?.approvedDraft).toBeUndefined();
  const before = store();
  const record = store().recordDecision({ ...input(), approvedDraft: pack.draftToPharmacy! });
  expect(store().records).toHaveLength(before.records.length + 1);
  expect(store().lifecycles[B.id].history).toHaveLength(before.lifecycles[B.id].history.length + 1);
  expect(record).toMatchObject({ approvedDraft: { text: pack.draftToPharmacy, approvedBy: "Demo operator", clauseId: "P2-C9" }, revision: 2 });
  expect(store().lifecycles[B.id].history.at(-1)?.approvedDraft).toEqual(store().records.at(-1)?.approvedDraft);
  store().setAgentEnabled(false);
  store().setAgentEnabled(true);
  expect(store().records.at(-1)?.approvedDraft).toEqual(store().lifecycles[B.id].history.at(-1)?.approvedDraft);
});

it("an unchecked draft and an Off approval request cannot create approval metadata", () => {
  store().submitFromPharmacy(B.id, B.extracted.endorsementText);
  store().arriveInQueue(B.id);
  expect(() => store().recordDecision({ ...input(), approvedDraft: "Claimed approval without opt-in" })).toThrow(/draft/);
  store().setAgentEnabled(true);
  store().recordDecision(input());
  expect(store().records.at(-1)?.approvedDraft).toBeUndefined();
  expect(store().lifecycles[B.id].history.at(-1)?.approvedDraft).toBeUndefined();
});

it("manual referral, approved draft, exact date, recheck and automatic pricing retain every prior attempt", () => {
  const seed = structuredClone(B);
  store().submitFromPharmacy(B.id, B.extracted.endorsementText);
  store().arriveInQueue(B.id);
  store().recordOperatorDecision(B.id, "REFER_BACK", "Please date the pharmacy endorsement");
  store().resubmitFromPharmacy(B.id, B.extracted.endorsementText);
  store().setAgentEnabled(true);
  store().arriveInQueue(B.id);
  const prior = store();
  const pack = runAgent(sessionCase(B.id)!);
  expect(pack.recommendation).toBe("REFER_BACK");
  store().recordDecision({ ...input(), approvedDraft: pack.draftToPharmacy! });
  const corrected = pharmacyDateCorrection(sessionCase(B.id)!, B.extracted.endorsementText);
  expect(corrected).toBe("NCSO  RK 21/08/26");
  const result = checkPharmacy(sessionCase(B.id)!, corrected);
  expect(result.status).toBe("ready");
  const records = store().records;
  store().resubmitFromPharmacy(B.id, corrected, pharmacySnapshot(corrected, B.extracted.dispensingDate, "scripted", result, new Date().toISOString()));
  store().arriveInQueue(B.id);
  expect(runAgent(sessionCase(B.id)!)).toMatchObject({ recommendation: "NONE", agentInvoked: false, state: "cleared_by_rules" });
  expect(store().lifecycles[B.id].state).toBe("paid");
  expect(store().lifecycles[B.id].history.at(-1)).toMatchObject({ actor: "code", revision: 4 });
  expect(store().records).toBe(records);
  expect(store().caseRevisions[B.id]).toHaveLength(4);
  expect(store().caseRevisions[B.id].slice(0, 3)).toEqual(prior.caseRevisions[B.id]);
  expect(store().records.filter((r) => r.caseId === B.id)).toHaveLength(2);
  expect(B).toEqual(seed);
  expect(runAgent(B).recommendation).toBe("REFER_BACK");
  expect(runAgent(B, { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
});