import { beforeEach, describe, expect, it } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { getAsSubmitted, getPaperReconciliation, isPaperReadyToRelease } from "../../src/lib/domain/submission-views";
import { getCorrectionAcknowledgementValid, getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";
import { initialisePharmacyDraft, initialisePharmacySubmissionDraft, preparePaperDemoDraft, previewPharmacyCorrection } from "../../src/lib/domain/pharmacy-correction";
import { buildReferralNote } from "../../src/lib/domain/referral-wording";

const s = () => useAppStore.getState();
const strength = "SYN-FQ123-MISMATCH", paper = "EX-24112", unreadable = "EX-24123";
beforeEach(() => s().resetDemo());

function sendStrength(enabled: boolean) {
  s().setAgentEnabled(enabled);
  const eps = caseById(strength)!.epsPrescription!;
  s().submitItem({ caseId: strength, channel: "eps", endorsementText: eps.dispenserEndorsement, epsPrescription: eps });
}

describe("Task 39/40 actual shared domain integration", () => {
  it("seeds exactly four truthful simultaneous month states without navigation writes", () => {
    expect(Object.keys(s().lifecycles).sort()).toEqual([...PLAYABLE_CASE_IDS].sort());
    expect(s().lifecycles["EX-24107"].state).toBe("paid");
    expect(s().lifecycles[strength].state).toBe("referred_back");
    expect(s().lifecycles[paper].state).toBe("resubmitted");
    expect(s().itemProcesses[paper].readyToRelease).toBe(true);
    expect(isPaperReadyToRelease(s().lifecycles[paper], s().itemProcesses[paper])).toBe(true);
    expect(isPaperReadyToRelease({ ...s().lifecycles[paper], history: [...s().lifecycles[paper].history,
      { ...s().lifecycles[paper].history.at(-1)!, revision: 3 }] }, s().itemProcesses[paper])).toBe(false);
    const before = getDomainSnapshot();
    s().setPerspective("pharmacy"); s().setAgentEnabled(true); s().setDemoStep(5);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("prices the selected wrong-strength EPS pack Today until an explicit human audit", () => {
    sendStrength(false);
    expect(s().lifecycles[strength].state).toBe("paid");
    expect(s().itemProcesses[strength].routing).toMatchObject({ outcome: "auto_priced", requiresHuman: false });
    expect(s().itemVerification[strength]).toMatchObject({ gate1: "none", gate2: "none" });
    const history = structuredClone(s().lifecycles[strength].history);
    const revision = s().caseRevisions[strength].at(-1)!;
    s().reopenForAudit(strength, revision.number, "Later audit queries the endorsed product.");
    expect(s().lifecycles[strength].history.slice(0, -1)).toEqual(history);
    expect(s().lifecycles[strength].history.at(-1)?.actor).toBe("operator");
  });

  it("blocks the ignored strength error at both proposed gates", () => {
    sendStrength(true);
    expect(s().itemVerification[strength]).toMatchObject({ gate1: "fail", gate2: "fail", reconciled: false, released: false });
    s().arriveInQueue(strength);
    expect(getReleaseEligibility(strength).allowed).toBe(false);
    expect(() => s().releaseToPricing(strength, "I waive the known mismatch.")).toThrow();
  });

  it("applies only the selected claim and automatically releases the corrected explicit Send", () => {
    s().setAgentEnabled(true);
    const revision = s().caseRevisions[strength].at(-1)!;
    s().setPharmacyDraft(strength, { ...initialisePharmacyDraft(sessionCase(strength)!, revision), purpose: "new_submission" });
    s().applySuggestedCorrection(strength);
    const draft = s().pharmacyDrafts[strength];
    expect(draft.epsPrescription?.items[0].dispensedCode).toBe("SYN-AMLO10-28");
    expect(draft.epsPrescription?.supplyRecord).toEqual(revision.epsPrescription?.supplyRecord);
    expect(s().caseRevisions[strength].at(-1)).toBe(revision);
    s().submitItem({ ...draft, caseId: strength, channel: "eps" });
    expect(s().lifecycles[strength].state).toBe("released_to_pricing");
    expect(s().itemVerification[strength]).toEqual({ gate1: "pass", gate2: "pass", reconciled: true, released: true });
    expect(s().lifecycles[strength].history.at(-1)?.actor).toBe("code");
  });

  it.each([false, true])("acknowledged strength corrections recheck automatically, mode=%s", (enabled) => {
    sendStrength(enabled);
    const revision = s().caseRevisions[strength].at(-1)!;
    if (enabled) s().arriveInQueue(strength);
    else s().reopenForAudit(strength, revision.number, "Later audit queries the endorsed product.");
    s().referBack(strength, "RB2B", buildReferralNote([{ rule: "strength_matches_prescription" }]));
    const draft = initialisePharmacyDraft(sessionCase(strength)!, revision);
    s().setPharmacyDraft(strength, { ...draft, purpose: "correction", epsPrescription: {
      ...draft.epsPrescription!, items: draft.epsPrescription!.items.map((item) => ({
        ...item, dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets",
      })),
    } });
    expect(() => s().resubmit(strength)).toThrow("must be checked");
    s().setCorrectionAcknowledgement(strength, revision.number, true);
    expect(getCorrectionAcknowledgementValid(strength)).toBe(true);
    s().resubmit(strength);
    expect(s().lifecycles[strength].state).toBe(enabled ? "released_to_pricing" : "paid");
    expect(s().itemProcesses[strength].routing.requiresHuman).toBe(false);
  });

  it("keeps unreadable original submission and scan unchanged through human capture", () => {
    s().setAgentEnabled(true);
    const originalRevision = s().caseRevisions[unreadable][0];
    const draft = preparePaperDemoDraft(sessionCase(unreadable)!, originalRevision, "complete");
    s().submitItem({ ...draft, caseId: unreadable, channel: "paper" });
    const before = getAsSubmitted(s(), unreadable);
    const revision = s().caseRevisions[unreadable].at(-1)!;
    expect(getPaperReconciliation(s(), unreadable)?.requiresType1).toBe(true);
    s().confirmType1({ caseId: unreadable, revision: revision.number, fields: revision.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    expect(getAsSubmitted(s(), unreadable)).toEqual(before);
    expect(s().lifecycles[unreadable].state).toBe("in_review");
    expect(s().itemVerification[unreadable].released).toBe(false);
    s().releaseToPricing(unreadable, "Human confirmed the paper source evidence.");
    expect(s().itemProcesses[unreadable].releaseOrigin).toBe("human_decision");
  });

  it("represents missing paper information without corrupting dates and never releases on Post", () => {
    const revision = s().caseRevisions[unreadable][0];
    const draft = preparePaperDemoDraft(sessionCase(unreadable)!, revision, "missing");
    expect(draft.paperDeclaration).toMatchObject({ typedProduct: "", quantity: null, endorsementText: "NCSO JB 27/08/26" });
    s().setAgentEnabled(true);
    s().submitItem({ ...draft, caseId: unreadable, channel: "paper" });
    expect(s().lifecycles[unreadable].state).toBe("submitted");
    expect(s().itemVerification[unreadable].released).toBe(false);
  });

  it.each([false, true])("rechecks acknowledged paper amendments but keeps the final operator press, mode=%s", (enabled) => {
    s().setAgentEnabled(enabled);
    const template = caseById(paper)!;
    s().submitItem({ caseId: paper, channel: "paper", endorsementText: template.paperDeclaration!.endorsementText,
      paperDeclaration: template.paperDeclaration });
    const submitted = getAsSubmitted(s(), paper);
    expect(s().itemProcesses[paper].routing.outcome).toBe("type2_endorsement");
    s().arriveInQueue(paper);
    const note = buildReferralNote([{ rule: "brand_required_for_multiple_suppliers" }]);
    s().referBack(paper, "RB2B", note);
    const revision = s().caseRevisions[paper].at(-1)!;
    const draft = initialisePharmacyDraft(sessionCase(paper)!, revision);
    s().setPharmacyDraft(paper, { ...draft, purpose: "correction",
      paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: template.pharmacySupplyRecord!.brandManufacturer } });
    s().setCorrectionAcknowledgement(paper, revision.number, true);
    s().resubmit(paper);
    expect(s().lifecycles[paper].state).toBe("resubmitted");
    expect(s().itemProcesses[paper].readyToRelease).toBe(true);
    expect(s().operatorDrafts[paper].outcome).toBe("ACCEPT");
    expect(getAsSubmitted({ lifecycles: s().lifecycles, caseRevisions: { [paper]: [submitted.asSubmitted] } }, paper)).toEqual(submitted);
    expect(getPaperReconciliation(s(), paper)?.outcome).toBe("RELEASE_RECOMMENDED");
    s().releaseToPricing(paper, "Human checked the acknowledged paper amendment.");
    expect(s().lifecycles[paper].state).toBe("released_to_pricing");
    expect(s().itemProcesses[paper].releaseOrigin).toBe("human_decision");
  });

  it("refuses correct-value leakage without silently rewriting the operator draft", () => {
    sendStrength(true); s().arriveInQueue(strength);
    const revision = s().caseRevisions[strength].at(-1)!;
    s().setOperatorDraft(strength, { revision: revision.number, outcome: "REFER_BACK", rbCode: "RB2B", note: "Please select Amlodipine 10mg tablets." });
    const before = getDomainSnapshot();
    expect(() => s().referBack(strength, "RB2B", s().operatorDrafts[strength].note)).toThrow("proposed corrected value");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("keeps the optional mismatch assumption in the same store and resets it independently", () => {
    const before = s().manualLoopInputs;
    expect(s().mismatchSharePercent).toBe("1");
    s().setMismatchSharePercent("2.5");
    expect(getDomainSnapshot().mismatchSharePercent).toBe("2.5");
    expect(s().manualLoopInputs).toBe(before);
    s().resetDemo();
    expect(s().mismatchSharePercent).toBe("1");
  });

  it("opens the original missing-brand submission scenario without changing the ready recheck seed", () => {
    const revision = s().caseRevisions[paper].at(-1)!, before = getDomainSnapshot();
    const draft = initialisePharmacySubmissionDraft(sessionCase(paper)!, revision, "paper");
    expect(draft.paperDeclaration?.brandManufacturer).toBe("");
    expect(revision.paperDeclaration?.brandManufacturer).toBe("Demo manufacturer (synthetic)");
    expect(draft.revision).toBe(revision.number);
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("fills missing paper pack and form only from the pharmacy record", () => {
    const revision = s().caseRevisions[paper].at(-1)!;
    const draft = initialisePharmacySubmissionDraft(sessionCase(paper)!, revision, "paper");
    const source = { ...draft, paperDeclaration: { ...draft.paperDeclaration!, packSize: null, form: "" } };
    const preview = previewPharmacyCorrection(sessionCase(paper)!, revision, source)!;
    expect(preview.paperDeclaration).toMatchObject({ packSize: 21, form: "capsules" });
    expect(preview.appliedFields).toEqual(expect.arrayContaining(["packSize", "form"]));
    expect(source.paperDeclaration).toMatchObject({ packSize: null, form: "" });
  });

  it.each(["referBack", "requestInformation", "recordType2Decision", "recordOperatorDecision"] as const)("rejects proposed presentation leakage through %s", (action) => {
    s().setAgentEnabled(false);
    const original = caseById(paper)!;
    s().submitItem({ caseId: paper, channel: "paper", endorsementText: original.paperDeclaration!.endorsementText, paperDeclaration: original.paperDeclaration });
    s().arriveInQueue(paper);
    const before = getDomainSnapshot(), note = "Please provide capsules as the accurate presentation.";
    expect(() => {
      if (action === "referBack") s().referBack(paper, "RB2B", note);
      else if (action === "requestInformation") s().requestInformation(paper, note);
      else if (action === "recordType2Decision") s().recordType2Decision({ caseId: paper, decision: "REFER_BACK", rbCode: "RB2B", reason: note });
      else s().recordOperatorDecision(paper, "REFER_BACK", note);
    }).toThrow("proposed corrected value");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("renders the actual amendment's supplied brand, pack and form in its scan source", () => {
    const replica = getAsSubmitted(s(), paper);
    const imageText = replica.paperScan!.regions.map((region) => region.text).join("\n");
    expect(imageText).toContain("Demo manufacturer (synthetic)");
    expect(imageText).toContain("Pack size 21");
    expect(imageText).toContain("capsules");
  });
});
