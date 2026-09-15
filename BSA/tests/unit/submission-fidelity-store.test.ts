import { beforeEach, describe, expect, it } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { lastPharmacySubmission } from "../../src/lib/domain/submission-fidelity";
import { getAsSubmitted, getPaperReconciliation } from "../../src/lib/domain/submission-views";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";
import { receiptPricingLabel } from "../../src/lib/domain/lifecycle";
import { staffLane } from "../../src/lib/case-presentation";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();
const workflows = (["both", "pharmacy", "nhsbsa"] as const).flatMap((perspective) =>
  [false, true].map((enabled) => ({ perspective, enabled })));

function currentReplica(id: string) {
  const revision = lastPharmacySubmission(store().caseRevisions[id]);
  const replica = getAsSubmitted(store(), id);
  expect(replica.asSubmitted).toEqual(revision);
  expect(replica.asSubmitted).toEqual(store().caseRevisions[id].filter((entry) => entry.kind !== "confirmation").at(-1));
  if (revision.channel === "paper") {
  expect(replica.paperScan).toEqual(revision.paperSource!.scan);
  expect(getPaperReconciliation(store(), id)?.evidence.revision).toBe(revision.number);
  expect(getPaperReconciliation(store(), id)?.evidence.characterRecognition).toEqual(revision.paperSource!.characterRecognition);
  }
  return replica;
}

function submitCurrent(id: string) {
  const revision = store().caseRevisions[id].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase(id)!, revision);
  store().submitItem({ ...draft, caseId: id, channel: draft.channel! });
}

beforeEach(() => store().resetDemo());

describe("submission fidelity through actual store actions", () => {
  it.each([false, true])("keeps all four original and newly sent payloads exact in every perspective, Agent=%s", (enabled) => {
    store().setAgentEnabled(enabled);
    const before = getDomainSnapshot();
    const originals = PLAYABLE_CASE_IDS.map(currentReplica);
    for (const id of PLAYABLE_CASE_IDS) {
      submitCurrent(id);
      const sent = currentReplica(id);
      expect(sent.asSubmitted.kind).toBe("submission");
      expect(sent.asSubmitted.verificationEnabled).toBe(enabled);
      store().arriveInQueue(id);
      expect(currentReplica(id)).toEqual(sent);
      const afterArrival = getDomainSnapshot();
      for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
        store().setPerspective(perspective);
        store().followCase(id);
        expect(currentReplica(id)).toEqual(sent);
        expect(store().caseRevisions).toEqual(afterArrival.caseRevisions);
        expect(store().lifecycles).toEqual(afterArrival.lifecycles);
      }
    }
    for (const [index, id] of PLAYABLE_CASE_IDS.entries()) {
      expect(store().caseRevisions[id].slice(0, -1)).toEqual(before.caseRevisions[id]);
      expect(originals[index].asSubmitted).toEqual(before.caseRevisions[id].at(-1));
    }
  });

  it.each(workflows)("keeps paper immutable across capture/referral/ACK/resubmit/release, Agent=$enabled, perspective=$perspective", ({ enabled, perspective }) => {
    const id = "EX-24123";
    store().setAgentEnabled(enabled);
    store().setPerspective(perspective);
    submitCurrent(id);
    store().arriveInQueue(id);
    const beforeCapture = currentReplica(id);
    const revision = beforeCapture.asSubmitted;
    const source = caseById(revision.templateCaseId)!;
    const fields = { ...revision.declaration!.fields, productCode: source.claim.productCode,
      quantity: source.claim.quantity, prescriber: "Dr Example (synthetic)" };
    store().confirmType1({ caseId: id, revision: revision.number, fields, provenance: "human_capture", declarationReconciled: true });
    expect(currentReplica(id)).toEqual(beforeCapture);
    expect(store().lifecycles[id].history.at(-1)?.capture?.fields).toEqual(fields);
    expect(beforeCapture.paperScan?.capturedEvidence).toBeUndefined();
    expect(beforeCapture.paperScan?.extracted.prescriber).toBe(source.extracted.prescriber);

    store().referBack(id, "RB2B", "Endorsement accuracy must be confirmed against the paper source; please state the accurate information.");
    expect(currentReplica(id)).toEqual(beforeCapture);
    const draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, purpose: "correction",
      declaration: { ...draft.declaration!, fields: { ...draft.declaration!.fields, prescriber: fields.prescriber } } });
    expect(currentReplica(id)).toEqual(beforeCapture);
    const priorRevisions = store().caseRevisions[id];
    store().setCorrectionAcknowledgement(id, revision.number, true);
    expect(currentReplica(id)).toEqual(beforeCapture);
    const acknowledgement = store().pharmacyDrafts[id].correctionAcknowledgement;
    store().resubmit(id);
    const resubmitted = currentReplica(id);
    expect(resubmitted.asSubmitted).toMatchObject({ kind: "resubmission", number: revision.number + 1, correctionAcknowledgement: acknowledgement });
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(priorRevisions);
    expect(beforeCapture.asSubmitted).toEqual(revision);
    expect(beforeCapture.paperScan).toEqual(source);

    expect(store().lifecycles[id].state).toBe("resubmitted");
    expect(store().itemProcesses[id].readyToRelease).toBe(true);
    expect(resubmitted.asSubmitted.paperSource?.provenance).toBe("acknowledged_pharmacy_amendment");
    expect(store().lifecycles[id].history.some((event) => event.revision === resubmitted.asSubmitted.number && event.capture)).toBe(false);
    expect(getPaperReconciliation(store(), id)?.outcome).toBe("RELEASE_RECOMMENDED");
    expect(currentReplica(id)).toEqual(resubmitted);
    store().releaseToPricing(id, "Current paper evidence reconciled against the retrieved Tariff.");
    expect(currentReplica(id)).toEqual(resubmitted);
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", processStep: "release_to_pricing" });
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(priorRevisions);
  });

  it.each(workflows)("keeps wrong-strength EPS exact through the complete cycle, Agent=$enabled, perspective=$perspective", ({ enabled, perspective }) => {
    const id = "SYN-FQ123-MISMATCH", template = caseById(id)!;
    store().setAgentEnabled(enabled);
    store().setPerspective(perspective);
    store().submitItem({ caseId: id, channel: "eps", endorsementText: template.epsPrescription!.dispenserEndorsement,
      epsPrescription: template.epsPrescription });
    const sent = currentReplica(id), initialRevisions = store().caseRevisions[id];
    expect(sent.asSubmitted.epsPrescription?.items[0].dispensedCode).toBe("SYN-AMLO5-28");
    if (enabled) {
      expect(store().itemVerification[id]).toMatchObject({ gate1: "fail", gate2: "fail", reconciled: false, released: false });
      store().arriveInQueue(id);
    } else {
      expect(store().lifecycles[id].state).toBe("paid");
      expect(staffLane(store().lifecycles[id], store().itemProcesses[id])).toBeNull();
      expect(store().itemVerification[id]).toMatchObject({ gate1: "none", gate2: "none" });
      const pricedHistory = store().lifecycles[id].history;
      store().reopenForAudit(id, sent.asSubmitted.number, "A later audit queries the selected product against source records.");
      expect(store().lifecycles[id].history.slice(0, -1)).toEqual(pricedHistory);
    }
    expect(currentReplica(id)).toEqual(sent);
    const note = buildReferralNote([{ rule: "strength_matches_prescription" }]);
    store().referBack(id, "RB2B", note);
    expect(store().lifecycles[id].history.at(-1)?.reason).toBe(note);
    expect(note).not.toMatch(/10\s*mg|SYN-AMLO10/);
    expect(currentReplica(id)).toEqual(sent);
    const draft = initialisePharmacyDraft(sessionCase(id)!, sent.asSubmitted);
    store().setPharmacyDraft(id, { ...draft, purpose: "correction" });
    if (enabled) store().applySuggestedCorrection(id);
    else store().setPharmacyDraft(id, { ...draft, purpose: "correction", epsPrescription: {
      ...draft.epsPrescription!, items: draft.epsPrescription!.items.map((item) => ({
        ...item, dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets",
      })),
    } });
    expect(currentReplica(id)).toEqual(sent);
    expect(() => store().resubmit(id)).toThrow(/must be checked/);
    store().setCorrectionAcknowledgement(id, sent.asSubmitted.number, true);
    const acknowledgement = store().pharmacyDrafts[id].correctionAcknowledgement;
    const history = store().lifecycles[id].history;
    store().resubmit(id);
    const corrected = currentReplica(id);
    expect(corrected.asSubmitted.correctionAcknowledgement).toEqual(acknowledgement);
    expect(corrected.asSubmitted.epsPrescription?.items[0].dispensedCode).toBe("SYN-AMLO10-28");
    expect(corrected.asSubmitted.epsPrescription?.supplyRecord).toEqual(sent.asSubmitted.epsPrescription?.supplyRecord);
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(initialRevisions);
    expect(store().lifecycles[id].history.slice(0, history.length)).toEqual(history);
    expect(store().lifecycles[id].history.slice(history.length).map((event) => event.actor)).toEqual(["pharmacy", "code"]);
    expect(store().lifecycles[id].state).toBe(enabled ? "released_to_pricing" : "paid");
    expect(store().itemProcesses[id].routing.requiresHuman).toBe(false);
    expect(staffLane(store().lifecycles[id], store().itemProcesses[id])).toBeNull();
    expect(receiptPricingLabel(store().lifecycles[id], corrected.asSubmitted.number)).toContain("Paid on the normal schedule");
    if (enabled) expect(store().itemVerification[id]).toEqual({ gate1: "pass", gate2: "pass", reconciled: true, released: true });
  });

  it.each(workflows)("keeps incomplete paper and its amendment distinct through one Release, Agent=$enabled, perspective=$perspective", ({ enabled, perspective }) => {
    const id = "EX-24112", template = caseById(id)!;
    store().setAgentEnabled(enabled);
    store().setPerspective(perspective);
    store().submitItem({ caseId: id, channel: "paper", endorsementText: template.paperDeclaration!.endorsementText,
      paperDeclaration: template.paperDeclaration });
    const sent = currentReplica(id), initialRevisions = store().caseRevisions[id];
    expect(sent.asSubmitted.paperDeclaration?.brandManufacturer).toBe("");
    expect(sent.asSubmitted.paperDeclaration?.dispensingDate).toBe("2026-08-21");
    expect(getPaperReconciliation(store(), id)?.outcome).toBe("REFER_BACK");
    store().arriveInQueue(id);
    const note = buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]);
    store().referBack(id, "RB2B", note);
    expect(currentReplica(id)).toEqual(sent);
    const draft = initialisePharmacyDraft(sessionCase(id)!, sent.asSubmitted);
    store().setPharmacyDraft(id, { ...draft, purpose: "correction" });
    if (enabled) store().applySuggestedCorrection(id);
    else store().setPharmacyDraft(id, { ...draft, purpose: "correction",
      paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: template.pharmacySupplyRecord!.brandManufacturer } });
    expect(currentReplica(id)).toEqual(sent);
    store().setCorrectionAcknowledgement(id, sent.asSubmitted.number, true);
    const acknowledgement = store().pharmacyDrafts[id].correctionAcknowledgement;
    store().resubmit(id);
    const amendment = currentReplica(id);
    expect(amendment.asSubmitted.correctionAcknowledgement).toEqual(acknowledgement);
    expect(amendment.asSubmitted.paperSource?.provenance).toBe("acknowledged_pharmacy_amendment");
    expect(amendment.asSubmitted.paperDeclaration?.brandManufacturer).toBe(template.pharmacySupplyRecord!.brandManufacturer);
    expect(store().lifecycles[id].state).toBe("resubmitted");
    expect(store().itemProcesses[id].readyToRelease).toBe(true);
    expect(store().operatorDrafts[id].outcome).toBe("ACCEPT");
    expect(getPaperReconciliation(store(), id)?.outcome).toBe("RELEASE_RECOMMENDED");
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(initialRevisions);
    expect(receiptPricingLabel(store().lifecycles[id], amendment.asSubmitted.number)).toBeNull();
    expect(getAsSubmitted({ lifecycles: store().lifecycles, caseRevisions: { [id]: initialRevisions } }, id)).toEqual(sent);
    store().releaseToPricing(id, "Human checked the acknowledged paper amendment against the retrieved Tariff.");
    expect(currentReplica(id)).toEqual(amendment);
    expect(receiptPricingLabel(store().lifecycles[id], amendment.asSubmitted.number)).toContain("Paid on the normal schedule");
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", processStep: "release_to_pricing" });
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(initialRevisions);
  });

  it("an explicit later EPS audit cannot rewrite the submitted object or earlier pricing history", () => {
    const id = "EX-24107", before = currentReplica(id), revisions = store().caseRevisions[id], history = store().lifecycles[id].history;
    store().reopenForAudit(id, before.asSubmitted.number, "A later human audit requests source comparison.");
    expect(currentReplica(id)).toEqual(before);
    expect(store().caseRevisions[id]).toEqual(revisions);
    expect(store().lifecycles[id].history.slice(0, -1)).toEqual(history);
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", processStep: "audit_reopened" });
  });

  it.each(PLAYABLE_CASE_IDS)("retains the last submission for %s through an information request and response", (id) => {
    submitCurrent(id);
    const original = currentReplica(id);
    const revision = original.asSubmitted;
    if (["paid", "released_to_pricing"].includes(store().lifecycles[id].state)) {
      store().reopenForAudit(id, revision.number, "A later human query requests additional source evidence.");
    } else {
      store().arriveInQueue(id);
    }
    if (store().itemProcesses[id].routing.outcome === "type1_capture") {
      const source = caseById(revision.templateCaseId)!;
      store().confirmType1({ caseId: id, revision: revision.number,
        fields: { productCode: source.claim.productCode, quantity: source.claim.quantity,
          endorsementText: revision.endorsementText, prescriber: "Dr Example (synthetic)" },
        provenance: "human_capture", declarationReconciled: true });
    }
    store().requestInformation(id, "Readable source evidence is required; please provide evidence for operator comparison.");
    expect(currentReplica(id)).toEqual(original);
    const before = store().caseRevisions[id];
    store().sendConfirmation(id, "Additional pharmacy evidence supplied for human comparison.");
    expect(store().caseRevisions[id].at(-1)?.kind).toBe("confirmation");
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(before);
    expect(currentReplica(id)).toEqual(original);
    expect(store().lifecycles[id].history.some((event) => event.actor === "pharmacy" &&
      event.revision === revision.number + 1 && event.processStep === "resubmission")).toBe(true);
  });
});
