import { beforeEach, describe, expect, it } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { initialisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { lastPharmacySubmission, submissionReplica } from "../../src/lib/domain/submission-fidelity";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState();

function currentReplica(id: string) {
  const revision = lastPharmacySubmission(store().caseRevisions[id]);
  const replica = submissionReplica(revision, revision.channel === "paper" ? caseById(revision.templateCaseId)! : undefined);
  expect(replica.asSubmitted).toEqual(revision);
  expect(replica.asSubmitted).toEqual(store().caseRevisions[id].filter((entry) => entry.kind !== "confirmation").at(-1));
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

  it.each([false, true])("keeps paper submission and raw scan immutable across capture, referral, ACK, resubmit and release, Agent=%s", (enabled) => {
    const id = "EX-24123";
    store().setAgentEnabled(enabled);
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

    store().arriveInQueue(id);
    store().confirmType1({ caseId: id, revision: resubmitted.asSubmitted.number, fields, provenance: "human_capture", declarationReconciled: true });
    expect(currentReplica(id)).toEqual(resubmitted);
    store().releaseToPricing(id, "Current paper evidence reconciled against the retrieved Tariff.");
    expect(currentReplica(id)).toEqual(resubmitted);
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", processStep: "release_to_pricing" });
    expect(store().caseRevisions[id].slice(0, -1)).toEqual(priorRevisions);
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
