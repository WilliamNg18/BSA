import { beforeEach, describe, expect, it } from "vitest";
import { caseById, PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { recommendationForAudience } from "../../src/lib/domain/recommendation-audience";
import { initialisePharmacyDraft, preparePaperDemoDraft } from "../../src/lib/domain/pharmacy-correction";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { getAsSubmitted, evaluatePaperSubmission } from "../../src/lib/domain/submission-views";
import { captureForRevision } from "../../src/lib/domain/lifecycle-model";

const s = () => useAppStore.getState(), strengthId = "SYN-FQ123-MISMATCH", paperId = "EX-24112", unreadableId = "EX-24123";
beforeEach(() => s().resetDemo());

describe("current four-case source-backed recommendations", () => {
  it.each(PLAYABLE_CASE_IDS)("derives complete audience contracts for %s without a state write", (id) => {
    const before = getDomainSnapshot();
    const result = deriveRecommendation(s(), id);
    expect(result.requirements.length).toBeGreaterThan(0);
    expect(result.version).toBe("2026-08");
    expect(Object.keys(result.signals)).toEqual(expect.arrayContaining(["provisionFound", "sampleAgreement", "reconciliation", "imageQuality", "inCoverage"]));
    expect(recommendationForAudience(result, "operator")).toMatchObject({ suggestions: [], preview: null });
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("wrong strength proposes only the actual shared 10mg patch and clears after human Apply", () => {
    s().setAgentEnabled(true);
    const revision = s().caseRevisions[strengthId].at(-1)!;
    s().setPharmacyDraft(strengthId, { ...initialisePharmacyDraft(sessionCase(strengthId)!, revision), purpose: "new_submission" });
    const before = deriveRecommendation(s(), strengthId, { kind: "draft" });
    expect(before.strength?.gap).toBe("Strength mismatch: prescribed 10mg, selected 5mg");
    expect(before.ruleAuthority).toBe("proposed_cross_record_check");
    expect(before.clause).toBeNull();
    expect(before.sourceGap).toBeNull();
    expect(before.signals).toMatchObject({ provisionStatus: "not_applicable", readingStatus: "not_applicable",
      imageStatus: "not_applicable", sampleAgreement: { agree: 0, total: 0 }, reconciliation: "conflict" });
    expect(before.requirements).toContainEqual(expect.objectContaining({ id: "selected_pack_matches", status: "not_met" }));
    expect(before.preview?.epsPrescription?.items[0].dispensedCode).toBe("SYN-AMLO10-28");
    expect(recommendationForAudience(before, "operator").operatorPreview?.note ?? "").not.toMatch(/10mg|5mg|\b28\b/);
    s().applySuggestedCorrection(strengthId);
    expect(s().pharmacyDrafts[strengthId]).toEqual(before.preview);
    const after = deriveRecommendation(s(), strengthId, { kind: "draft" });
    expect(after).toMatchObject({ outcome: "COMPLETE", missing: [], suggestions: [], preview: null });
    expect(after.strength?.complete).toBe(true);
    expect(s().caseRevisions[strengthId].at(-1)).toEqual(revision);
  });

  it("paper brand advice derives the pinned triad and copies only a field/rule operator note", () => {
    s().setAgentEnabled(true);
    const original = caseById(paperId)!;
    s().submitItem({ caseId: paperId, channel: "paper", endorsementText: original.paperDeclaration!.endorsementText, paperDeclaration: original.paperDeclaration });
    s().arriveInQueue(paperId);
    const revision = s().caseRevisions[paperId].at(-1)!;
    const result = deriveRecommendation(s(), paperId);
    expect(result.paper).toEqual(evaluatePaperSubmission(original, revision, captureForRevision(s().lifecycles[paperId], revision.number)));
    expect(result.paper).toMatchObject({ requiresType1: false, outcome: "REFER_BACK", automaticRelease: false });
    expect(result.requirements).toContainEqual(expect.objectContaining({ id: "brand_manufacturer", status: "not_met" }));
    expect(result.suggestions).toContainEqual(expect.objectContaining({ field: "brand_manufacturer", value: original.pharmacySupplyRecord!.brandManufacturer }));
    expect(result.operatorPreview?.note).toContain("Brand or manufacturer required");
    expect(result.operatorPreview?.note).not.toContain(original.pharmacySupplyRecord!.brandManufacturer!);
    s().applySuggestionToDecision(paperId);
    expect(s().operatorDrafts[paperId].note).toBe(result.operatorPreview?.note);
    expect(s().itemVerification[paperId].released).toBe(false);
  });

  it("corrected paper ready for human release is complete without inventing a new Apply action", () => {
    const result = deriveRecommendation(s(), paperId);
    expect(result).toMatchObject({ outcome: "COMPLETE", requiresOperatorRelease: true, missing: [], suggestions: [], preview: null,
      paper: { outcome: "RELEASE_RECOMMENDED", automaticRelease: false } });
    expect(result.summary).toContain("requires the operator's press because paper was scanned");
    expect(result.nextStep).not.toContain("Type 1");
    expect(result.provenance).toBe("Pharmacy declaration reconciled with the recorded scan and hypothetical extraction.");
    expect(result.provenance).not.toContain("will be verified");
    expect(result.operatorApplyAllowed).toBe(false);
    expect(s().itemVerification[paperId].released).toBe(false);
  });

  it("unreadable paper keeps original scan and OCR distinct from confirmed capture", () => {
    s().setAgentEnabled(true);
    const revision = s().caseRevisions[unreadableId].at(-1)!;
    const draft = preparePaperDemoDraft(sessionCase(unreadableId)!, revision, "complete");
    s().submitItem({ ...draft, caseId: unreadableId, channel: "paper" });
    const submitted = getAsSubmitted(s(), unreadableId);
    const before = deriveRecommendation(s(), unreadableId);
    expect(before.paper?.requiresType1).toBe(true);
    expect(before.operatorApplyAllowed).toBe(false);
    const received = s().caseRevisions[unreadableId].at(-1)!;
    s().confirmType1({ caseId: unreadableId, revision: received.number, fields: received.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    const after = deriveRecommendation(s(), unreadableId);
    expect(after.paper).toMatchObject({ reconciliationBasis: "human_confirmed_capture", outcome: "RELEASE_RECOMMENDED" });
    expect(after.provenance).toBe("Pharmacy declaration reconciled with human-confirmed capture; original scan and hypothetical extraction retained.");
    expect(after.paper?.evidence.scan).toEqual(before.paper?.evidence.scan);
    expect(after.paper?.evidence.characterRecognition).toEqual(before.paper?.evidence.characterRecognition);
    expect(getAsSubmitted(s(), unreadableId)).toEqual(submitted);
    expect(after.requiresOperatorRelease).toBe(true);
  });

  it("two missing paper fields get source-record values with every date unchanged", () => {
    const revision = s().caseRevisions[unreadableId].at(-1)!;
    const draft = preparePaperDemoDraft(sessionCase(unreadableId)!, revision, "missing");
    s().setPharmacyDraft(unreadableId, draft);
    const result = deriveRecommendation(s(), unreadableId, { kind: "draft" });
    expect(result.suggestions).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "product", value: "SYN-COCOD-100" }),
      expect.objectContaining({ field: "quantity_stated", value: 100 }),
    ]));
    expect(result.preview?.paperDeclaration?.dispensingDate).toBe(draft.paperDeclaration?.dispensingDate);
    expect(result.preview?.endorsementText).toBe(draft.endorsementText);
    expect(result.paper).toBeUndefined();
    expect(result.provenance).toContain("will be verified against the scan at NHSBSA");
  });

  it("recorded paper triads and referrals cannot borrow a later acknowledged correction", () => {
    s().setAgentEnabled(true);
    const original = caseById(paperId)!;
    s().submitItem({ caseId: paperId, channel: "paper", endorsementText: original.paperDeclaration!.endorsementText,
      paperDeclaration: original.paperDeclaration });
    s().arriveInQueue(paperId);
    const revision = s().caseRevisions[paperId].at(-1)!;
    s().applySuggestionToDecision(paperId);
    s().referBack(paperId, s().operatorDrafts[paperId].rbCode, s().operatorDrafts[paperId].note);
    const record = s().records.at(-1)!;
    const context = { kind: "recorded" as const, revision: revision.number, recordId: record.id };
    const before = deriveRecommendation(s(), paperId, context);
    expect(before.operatorApproved).toBe(true);
    const draft = initialisePharmacyDraft(sessionCase(paperId)!, revision);
    s().setPharmacyDraft(paperId, { ...draft, purpose: "correction" });
    s().applySuggestedCorrection(paperId);
    s().setCorrectionAcknowledgement(paperId, revision.number, true);
    s().resubmit(paperId);
    expect(deriveRecommendation(s(), paperId).paper?.outcome).toBe("RELEASE_RECOMMENDED");
    expect(deriveRecommendation(s(), paperId, context)).toEqual(before);
    expect(before.paper?.evidence.declaration.brandManufacturer).toBe("");
    expect(before.paper?.automaticRelease).toBe(false);
  });
});
