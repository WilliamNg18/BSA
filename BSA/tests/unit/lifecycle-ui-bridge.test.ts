import { beforeEach, expect, it } from "vitest";
import { CASES, caseById } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { checkPharmacyCorrection, initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
const B = caseById("EX-24112")!;
beforeEach(() => store().resetDemo());
function input() {
  const pack = runAgent(sessionCase(B.id)!);
  return { caseId: B.id, tariffVersion: pack.tariffVersion, agentVersion: pack.agentVersion,
    inputs: pack.evidence.map((e) => e.value), sources: pack.evidence.map((e) => e.origin), checks: pack.gate.checks,
    recommendation: pack.recommendation, decision: "REFER_BACK" as const, overrideReason: "Human checked the missing manufacturer information" };
}

function submitPaper() {
  store().submitItem({ caseId: B.id, channel: "paper", endorsementText: B.paperDeclaration!.endorsementText,
    paperDeclaration: B.paperDeclaration });
  store().arriveInQueue(B.id);
}

function acknowledge() {
  store().setCorrectionAcknowledgement(B.id, store().caseRevisions[B.id].at(-1)!.number, true);
}

it("recordDecision accepts only explicit human draft approval and links it exactly once", () => {
  submitPaper();
  store().setAgentEnabled(true);
  const pack = runAgent(sessionCase(B.id)!);
  expect(store().lifecycles[B.id].history.at(-1)?.approvedDraft).toBeUndefined();
  const before = store();
  const record = store().recordDecision({ ...input(), approvedDraft: pack.draftToPharmacy! });
  expect(store().records).toHaveLength(before.records.length + 1);
  expect(store().lifecycles[B.id].history).toHaveLength(before.lifecycles[B.id].history.length + 1);
  expect(record).toMatchObject({ approvedDraft: { text: pack.draftToPharmacy, approvedBy: "Demo operator", clauseId: "SYN-EPS-SUPPLY" },
    revision: before.caseRevisions[B.id].at(-1)!.number });
  expect(store().lifecycles[B.id].history.at(-1)?.approvedDraft).toEqual(store().records.at(-1)?.approvedDraft);
  store().setAgentEnabled(false);
  store().setAgentEnabled(true);
  expect(store().records.at(-1)?.approvedDraft).toEqual(store().lifecycles[B.id].history.at(-1)?.approvedDraft);
});

it("an unchecked draft and an Off approval request cannot create approval metadata", () => {
  submitPaper();
  expect(() => store().recordDecision({ ...input(), approvedDraft: "Claimed approval without opt-in" })).toThrow(/draft/);
  store().setAgentEnabled(true);
  store().recordDecision(input());
  expect(store().records.at(-1)?.approvedDraft).toBeUndefined();
  expect(store().lifecycles[B.id].history.at(-1)?.approvedDraft).toBeUndefined();
});

it("manual referral, approved draft, acknowledged brand correction and human paper release retain every prior attempt", () => {
  const seed = structuredClone(B);
  const originalRevisions = store().caseRevisions[B.id];
  submitPaper();
  store().recordOperatorDecision(B.id, "REFER_BACK", "Please check the required manufacturer information");
  const revision = store().caseRevisions[B.id].at(-1)!;
  store().setPharmacyDraft(B.id, { ...initialisePharmacyDraft(sessionCase(B.id)!, revision), purpose: "correction" });
  expect(() => store().resubmit(B.id)).toThrow("must be checked");
  acknowledge();
  store().resubmit(B.id);
  store().setAgentEnabled(true);
  store().arriveInQueue(B.id);
  const prior = store();
  const pack = runAgent(sessionCase(B.id)!);
  expect(pack.recommendation).toBe("REFER_BACK");
  store().recordDecision({ ...input(), approvedDraft: pack.draftToPharmacy! });
  const currentRevision = store().caseRevisions[B.id].at(-1)!;
  store().setPharmacyDraft(B.id, { ...initialisePharmacyDraft(sessionCase(B.id)!, currentRevision), purpose: "correction" });
  store().applySuggestedCorrection(B.id);
  const corrected = store().pharmacyDrafts[B.id];
  expect(corrected.paperDeclaration?.brandManufacturer).toBe(B.pharmacySupplyRecord!.brandManufacturer);
  expect(corrected.endorsementText).toBe(B.paperDeclaration!.endorsementText);
  const result = checkPharmacyCorrection(sessionCase(B.id)!, currentRevision, corrected);
  expect(result.status).toBe("ready");
  const records = store().records;
  expect(() => store().resubmit(B.id)).toThrow("must be checked");
  acknowledge();
  store().resubmit(B.id);
  expect(runAgent(sessionCase(B.id)!)).toMatchObject({ recommendation: "SUFFICIENT", agentInvoked: true, state: "agent_review_complete" });
  expect(store().lifecycles[B.id].state).toBe("resubmitted");
  expect(store().itemProcesses[B.id].readyToRelease).toBe(true);
  expect(store().itemVerification[B.id].released).toBe(false);
  expect(store().records).toBe(records);
  store().releaseToPricing(B.id, "Human rechecked the correction and source evidence.");
  expect(store().lifecycles[B.id].state).toBe("released_to_pricing");
  expect(store().lifecycles[B.id].history.at(-1)).toMatchObject({ actor: "operator", releaseOrigin: "human_decision",
    revision: currentRevision.number + 1 });
  expect(store().records.slice(0, records.length)).toEqual(records);
  expect(store().caseRevisions[B.id]).toHaveLength(originalRevisions.length + 3);
  expect(store().caseRevisions[B.id].slice(0, prior.caseRevisions[B.id].length)).toEqual(prior.caseRevisions[B.id]);
  expect(store().caseRevisions[B.id].slice(0, originalRevisions.length)).toEqual(originalRevisions);
  expect(store().records.filter((r) => r.caseId === B.id)).toHaveLength(3);
  expect(B).toEqual(seed);
  expect(runAgent(B).recommendation).toBe("REFER_BACK");
  expect(runAgent(CASES[1], { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
});