import { beforeEach, describe, expect, it } from "vitest";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { correctionFingerprint } from "../../src/lib/domain/correction-acknowledgement";
import { caseById } from "../../src/lib/domain/cases";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";

const store = () => useAppStore.getState();
const id = "EX-24112";
beforeEach(() => store().resetDemo());

function draftCorrection() {
  const template = caseById(id)!;
  store().submitItem({ caseId: id, channel: "paper", endorsementText: template.paperDeclaration!.endorsementText,
    paperDeclaration: template.paperDeclaration });
  store().arriveInQueue(id);
  store().referBack(id, "RB2B", buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]));
  const revision = store().caseRevisions[id].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase(id)!, revision);
  store().setPharmacyDraft(id, { ...draft, purpose: "correction",
    paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: template.pharmacySupplyRecord!.brandManufacturer } });
  return revision;
}

describe("Task 40 explicit correction and audit actions", () => {
  it.each([false, true])("requires an exact human acknowledgement before resubmission, mode=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    const revision = draftCorrection(), before = getDomainSnapshot();
    expect(() => store().resubmit(id)).toThrow("must be checked");
    expect(getDomainSnapshot()).toEqual(before);
    store().setCorrectionAcknowledgement(id, revision.number, true);
    const acknowledged = store().pharmacyDrafts[id].correctionAcknowledgement;
    expect(acknowledged?.fingerprint).toBe(correctionFingerprint(store().pharmacyDrafts[id]));
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "pharmacy", from: "referred_back", to: "referred_back", processStep: "correction_acknowledged" });
    store().resubmit(id);
    expect(store().caseRevisions[id].at(-1)?.correctionAcknowledgement).toEqual(acknowledged);
    expect(store().caseRevisions[id].at(-2)).toEqual(revision);
    expect(store().pharmacyDrafts[id]).toBeUndefined();
  });

  it("rejects forged, stale and withdrawn acknowledgements atomically", () => {
    const revision = draftCorrection();
    const draft = store().pharmacyDrafts[id];
    const acknowledgement = { revision: revision.number, fingerprint: correctionFingerprint(draft) };
    const before = getDomainSnapshot();
    expect(() => store().resubmitItem({ ...draft, caseId: id, channel: "paper", correctionAcknowledgement: acknowledgement })).toThrow("explicit");
    expect(getDomainSnapshot()).toEqual(before);
    expect(() => store().setCorrectionAcknowledgement(id, revision.number - 1, true)).toThrow("stale");
    store().setCorrectionAcknowledgement(id, revision.number, true);
    store().setCorrectionAcknowledgement(id, revision.number, false);
    expect(() => store().resubmitItem({ ...draft, caseId: id, channel: "paper", correctionAcknowledgement: acknowledgement })).toThrow("explicit");
  });

  it("payload edits invalidate acknowledgement while perspective and mode changes do not", () => {
    const revision = draftCorrection();
    store().setCorrectionAcknowledgement(id, revision.number, true);
    const acknowledged = getDomainSnapshot();
    store().setAgentEnabled(true);
    store().setPerspective("pharmacy");
    expect(getDomainSnapshot()).toEqual(acknowledged);
    const current = store().pharmacyDrafts[id];
    store().setPharmacyDraft(id, { ...current, paperDeclaration: { ...current.paperDeclaration!, brandManufacturer: "" } });
    expect(store().pharmacyDrafts[id].correctionAcknowledgement).toBeUndefined();
    expect(() => store().resubmit(id)).toThrow();
  });

  it("reopens an automatically priced EPS item only through an explicit human audit, retaining history", () => {
    const caseId = "EX-24107", before = getDomainSnapshot();
    store().setAgentEnabled(true);
    expect(getDomainSnapshot()).toEqual(before);
    store().setAgentEnabled(false);
    const revision = store().caseRevisions[caseId].at(-1)!;
    expect(() => store().reopenForAudit(caseId, revision.number, "")).toThrow("reason");
    store().reopenForAudit(caseId, revision.number, "Later human query about the endorsed product.");
    expect(store().lifecycles[caseId].history.slice(0, -1)).toEqual(before.lifecycles[caseId].history);
    expect(store().lifecycles[caseId].history.at(-1)).toMatchObject({ actor: "operator", from: "paid", to: "in_review", processStep: "audit_reopened" });
    expect(store().caseRevisions).toEqual(before.caseRevisions);
    expect(store().itemProcesses[caseId].routing).toMatchObject({ outcome: "type2_endorsement", requiresHuman: true });
    expect(store().itemVerification).toEqual(before.itemVerification);
  });
});
