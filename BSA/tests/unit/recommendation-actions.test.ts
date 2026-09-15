import { beforeEach, describe, expect, it } from "vitest";
import { deriveRecommendation, validateDiagnosticFollowUp } from "../../src/lib/domain/recommendations";
import { preparePaperDemoDraft } from "../../src/lib/domain/pharmacy-correction";
import { getDomainSnapshot, getReleaseEligibility, sessionCase, useAppStore } from "../../src/lib/store";

const store = () => useAppStore.getState(), id = "EX-24123";
beforeEach(() => store().resetDemo());

function captureMismatch() {
  store().setAgentEnabled(true);
  const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id][0], "complete");
  store().submitItem({ ...draft, channel: "paper", caseId: id });
  store().confirmType1({ caseId: id, revision: 2, provenance: "human_capture", declarationReconciled: false,
    fields: { productCode: "SYN-COCOD-100", quantity: 50, endorsementText: "NCSO JB 27/08/26", prescriber: "Dr Example (synthetic)" } });
}

describe("safe human diagnostic follow-up", () => {
  it("keeps ABSTAIN and unsuccessful gates while applying exact field disagreements", () => {
    captureMismatch();
    const before = getDomainSnapshot(), r = deriveRecommendation(store(), id);
    expect(r.kernelRecommendation).toBe("ABSTAIN");
    expect(r.diagnostic).toMatchObject({ kind: "safe_human_follow_up", outcome: "REFER_BACK", rbCode: "RB2B", provenance: "reconciliation_failed" });
    expect(r.diagnostic?.note).toContain('Quantity: pharmacy declared "100"; human capture "50"');
    expect(r.operatorApplyAllowed).toBe(true);
    store().applySuggestionToDecision(id);
    expect(store().operatorDrafts[id]).toEqual({ ...r.operatorPreview, appliedSuggestion: true });
    expect(store().records).toEqual([]);
    expect(store().itemVerification).toEqual(before.itemVerification);
    expect(store().caseRevisions).toEqual(before.caseRevisions);
    expect(store().lifecycles[id].state).toBe("in_review");
    expect(store().lifecycles[id].history.at(-1)?.appliedSuggestionEvidence).toMatchObject({
      recommendation: "ABSTAIN", diagnostic: r.diagnostic,
    });
    expect(getReleaseEligibility(id).allowed).toBe(false);
    expect(() => store().releaseToPricing(id, "Ignore the failed source comparison")).toThrow();
  });

  it("only a separate explicit final referral approves diagnostic text", () => {
    captureMismatch();
    const r = deriveRecommendation(store(), id);
    store().applySuggestionToDecision(id);
    expect(deriveRecommendation(store(), id).operatorApproved).toBe(false);
    const draft = store().operatorDrafts[id];
    store().referBack(id, draft.rbCode, draft.note);
    const record = store().records.at(-1)!;
    expect(record).toMatchObject({ decision: "REFER_BACK", recommendation: "ABSTAIN", revision: 2,
      approvedDraft: { provenance: "reconciliation_failed", diagnostic: r.diagnostic, text: draft.note } });
    expect(record.checks).toEqual(store().lifecycles[id].history.find((entry) => entry.appliedSuggestionEvidence)?.appliedSuggestionEvidence?.checks);
    expect(store().lifecycles[id].state).toBe("referred_back");
    expect(store().itemVerification[id].released).toBe(false);
    expect(deriveRecommendation(store(), id).operatorApproved).toBe(true);
  });

  it("explicit confirmation without reconciliation supports safe information request, never release", () => {
    store().setAgentEnabled(true);
    const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id][0], "complete");
    store().submitItem({ ...draft, channel: "paper", caseId: id });
    store().confirmType1({ caseId: id, revision: 2, provenance: "human_capture", declarationReconciled: false,
      fields: draft.declaration!.fields });
    const r = deriveRecommendation(store(), id);
    expect(r.diagnostic).toMatchObject({ outcome: "REQUEST_INFORMATION", provenance: "unverified" });
    store().applySuggestionToDecision(id);
    store().requestInformation(id, store().operatorDrafts[id].note);
    expect(store().records.at(-1)).toMatchObject({ decision: "REQUEST_INFORMATION", recommendation: "ABSTAIN",
      approvedDraft: { provenance: "unverified" } });
    expect(store().lifecycles[id].state).toBe("information_requested");
    expect(store().itemVerification[id].released).toBe(false);
  });

  it("missing captured prescriber remains explicit and gets safe information advice, not sufficient", () => {
    store().setAgentEnabled(true);
    const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id][0], "complete");
    store().submitItem({ ...draft, channel: "paper", caseId: id });
    store().confirmType1({ caseId: id, revision: 2, provenance: "human_capture", declarationReconciled: true,
      fields: { ...draft.declaration!.fields, prescriber: "" } });
    const r = deriveRecommendation(store(), id);
    expect(r).toMatchObject({ outcome: "REQUEST_INFORMATION", diagnostic: { outcome: "REQUEST_INFORMATION" } });
    expect(r.missing.join(" ")).toContain("Prescriber present");
    expect(r.operatorApplyAllowed).toBe(true);
    expect(getReleaseEligibility(id).allowed).toBe(false);
  });

  it("complete demo declaration reaches sufficient only after confirmation and releases only after human final action", () => {
    store().setAgentEnabled(true);
    const original = sessionCase(id)!.extracted;
    const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id][0], "complete");
    store().submitItem({ ...draft, channel: "paper", caseId: id });
    expect(store().itemVerification[id].released).toBe(false);
    store().confirmType1({ caseId: id, revision: 2, provenance: "pharmacy_declaration", declarationReconciled: true,
      fields: draft.declaration!.fields });
    const r = deriveRecommendation(store(), id);
    expect(r).toMatchObject({ outcome: "COMPLETE", kernelRecommendation: "SUFFICIENT", operatorApplyAllowed: true });
    store().applySuggestionToDecision(id);
    expect(store().itemVerification[id].released).toBe(false);
    store().releaseToPricing(id);
    expect(store().lifecycles[id].history.at(-1)).toMatchObject({ actor: "operator", releaseOrigin: "human_decision" });
    expect(sessionCase(id)!.extracted).toEqual(original);
  });

  it("a later draft cannot borrow prior confirmed paper evidence or approval", () => {
    captureMismatch();
    store().applySuggestionToDecision(id);
    store().referBack(id, "RB2B", store().operatorDrafts[id].note);
    const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!, "missing");
    store().setPharmacyDraft(id, draft);
    const recommendation = deriveRecommendation(store(), id, { kind: "draft" });
    expect(recommendation).toMatchObject({ operatorApproved: false, kernelRecommendation: "ABSTAIN", diagnostic: null });
    expect(recommendation.signals).toMatchObject({ reconciliation: "not_established", sampleAgreement: { agree: 0, total: 0 } });
    expect(recommendation.missing).toContain("Dated");
    expect(recommendation.missing.join(" ")).not.toContain("50");
  });

  it("recorded diagnostic remains pinned after a corrected later attempt", () => {
    captureMismatch();
    store().applySuggestionToDecision(id);
    store().referBack(id, "RB2B", store().operatorDrafts[id].note);
    const record = store().records.at(-1)!;
    const context = { kind: "recorded" as const, revision: 2, recordId: record.id };
    const before = deriveRecommendation(store(), id, context);
    const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id].at(-1)!, "complete");
    store().submitItem({ ...draft, channel: "paper", caseId: id });
    expect(deriveRecommendation(store(), id, context)).toEqual(before);
    expect(before).toMatchObject({ kernelRecommendation: "ABSTAIN", kernelGate: "NOT_RUN", operatorApproved: true });
  });

  it("rejects a forged diagnostic snapshot and a final approval without Apply", () => {
    captureMismatch();
    const diagnostic = deriveRecommendation(store(), id).diagnostic!;
    expect(() => validateDiagnosticFollowUp(store(), id, { ...diagnostic, note: "Invented mismatch" })).toThrow("does not match");
    expect(() => store().recordType2Decision({ caseId: id, decision: "REFER_BACK", rbCode: "RB2B",
      reason: diagnostic.note, approvedDraft: diagnostic.note })).toThrow("explicitly applied");
    expect(store().records).toEqual([]);
  });

  it("cannot apply Type 2 advice before actual Type 1 capture", () => {
    store().setAgentEnabled(true);
    expect(deriveRecommendation(store(), id).operatorApplyAllowed).toBe(false);
    expect(() => store().applySuggestionToDecision(id)).toThrow("No validated suggestion");
  });

  it("edited diagnostic text is a manual note, never approved agent findings", () => {
    captureMismatch();
    store().applySuggestionToDecision(id);
    store().setOperatorDraft(id, { ...store().operatorDrafts[id], note: "Please provide independent readable evidence." });
    store().requestInformation(id, store().operatorDrafts[id].note);
    expect(store().records.at(-1)?.approvedDraft).toBeUndefined();
    expect(store().itemVerification[id].released).toBe(false);
  });

  it.each(["complete", "missing"] as const)("synthetic %s prefill is draft-only and preserves every original attempt", (variant) => {
    const before = getDomainSnapshot();
    const draft = preparePaperDemoDraft(sessionCase(id)!, store().caseRevisions[id][0], variant);
    expect(draft).toMatchObject({ purpose: "new_submission", appliedSuggestion: false });
    expect(draft.declaration?.fields.prescriber).toBe("Dr Example (synthetic demo declaration)");
    expect(draft.endorsementText).toBe(variant === "complete" ? "NCSO JB 27/08/26" : "NCSO JB");
    expect(getDomainSnapshot()).toEqual(before);
  });
});
