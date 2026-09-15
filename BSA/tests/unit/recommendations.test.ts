import { beforeEach, describe, expect, it } from "vitest";
import { PLAYABLE_CASE_IDS } from "../../src/lib/domain/cases";
import { deriveRecommendation } from "../../src/lib/domain/recommendations";
import { initialisePharmacyDraft, suggestedPharmacyCorrection } from "../../src/lib/domain/pharmacy-correction";
import { getDomainSnapshot, sessionCase, useAppStore } from "../../src/lib/store";
import { concreteSuggestions } from "../../src/lib/domain/recommendation-suggestions";

const store = () => useAppStore.getState();
beforeEach(() => store().resetDemo());

describe("shared recommendation contract", () => {
  it.each(PLAYABLE_CASE_IDS)("contains every required field for %s without changing state", (id) => {
    const before = getDomainSnapshot(), r = deriveRecommendation(store(), id);
    for (const key of ["clause", "version", "requirements", "missing", "suggestions", "outcome", "signals", "preview", "provenance"]) expect(r).toHaveProperty(key);
    expect(Object.keys(r.signals)).toHaveLength(5);
    expect(r.authorityLabel).toBe("the agent verifies and advises; a person decides");
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("complete EPS reports the dated clause without inventing a model invocation", () => {
    const r = deriveRecommendation(store(), "EX-24107");
    expect(r).toMatchObject({ outcome: "COMPLETE", version: "2026-08", missing: [], suggestions: [], preview: null, kernelRecommendation: "NONE" });
    expect(r.summary).toBe("Complete against Clause 9, Version August 2026; nothing to add.");
  });

  it("previews and applies the actual selected pack through exactly one helper", () => {
    const id = "SYN-FQ123-MISMATCH", revision = store().caseRevisions[id].at(-1)!, current = sessionCase(id)!;
    store().setAgentEnabled(true);
    store().setPharmacyDraft(id, { ...initialisePharmacyDraft(current, revision), purpose: "new_submission" });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r.suggestions[0]).toMatchObject({ field: "selected_pack_matches", value: "Amlodipine 10mg tablets, 28" });
    expect(r.preview?.epsPrescription?.dispensingDate).toBe(revision.epsPrescription?.dispensingDate);
    expect(r.preview).toEqual(suggestedPharmacyCorrection(current, revision, store().pharmacyDrafts[id]));
    const attempts = store().caseRevisions[id];
    store().applySuggestedCorrection(id);
    expect(store().pharmacyDrafts[id]).toEqual(r.preview);
    expect(store().caseRevisions[id]).toEqual(attempts);
  });

  it("wrong pack is not complete and proposes the actual registered pack", () => {
    const r = deriveRecommendation(store(), "SYN-FQ123-MISMATCH");
    expect(r.outcome).not.toBe("COMPLETE");
    expect(r.suggestions).toContainEqual(expect.objectContaining({ field: "selected_pack_matches", value: "Amlodipine 10mg tablets, 28" }));
  });

  it("paper declaration complete is distinct from unverified received paper", () => {
    const draft = deriveRecommendation(store(), "EX-24123", { kind: "draft" });
    expect(draft.outcome).toBe("COMPLETE");
    expect(draft.sourceAssessment).toBeNull();
    expect(draft.verification).toBeNull();
    expect(draft.provenance).toContain("declared by the pharmacy, not read from the form");
    const received = deriveRecommendation(store(), "EX-24123");
    expect(received.outcome).toBe("REQUEST_INFORMATION");
    expect(received.kernelRecommendation).toBe("ABSTAIN");
    expect(received.requiresOperatorRelease).toBe(true);
    expect(received.diagnostic?.provenance).toBe("unverified");
    expect(received.sourceAssessment).toMatchObject({ gate1: "pass", gate2: "fail", reconciled: false });
    expect(store().itemVerification["EX-24123"].released).toBe(false);
  });

  it("recorded attempts cannot borrow a later correction or a live draft", () => {
    const id = "EX-24107", before = deriveRecommendation(store(), id, { kind: "recorded", revision: 1 });
    store().submitFromPharmacy(id, "NCSO JB 14/08/26");
    expect(deriveRecommendation(store(), id, { kind: "recorded", revision: 1 })).toEqual(before);
    expect(deriveRecommendation(store(), id).outcome).toBe("COMPLETE");
    expect(() => deriveRecommendation(store(), id, { kind: "recorded", revision: 100 })).toThrow("unavailable");
  });

  it("a complete-looking EPS ledger mismatch cannot claim nothing to add", () => {
    const id = "EX-24107", revision = store().caseRevisions[id][0];
    const eps = revision.epsPrescription!;
    store().submitItem({ caseId: id, channel: "eps", endorsementText: eps.dispenserEndorsement,
      epsPrescription: { ...eps, items: [{ ...eps.items[0], quantity: 56 }] } });
    const r = deriveRecommendation(store(), id);
    expect(r.outcome).not.toBe("COMPLETE");
    expect(r.missing).toContain("Independent claim product and quantity agree");
    expect(r.summary).not.toContain("nothing to add");
    store().arriveInQueue(id);
    const current = deriveRecommendation(store(), id);
    expect(current.operatorPreview?.outcome).not.toBe("ACCEPT");
    if (current.operatorApplyAllowed) {
      store().setAgentEnabled(true);
      store().applySuggestionToDecision(id);
      expect(store().operatorDrafts[id].outcome).toBe(current.outcome);
    }
  });

  it("a draft EPS mismatch does not borrow a complete submitted result", () => {
    const id = "EX-24107", revision = store().caseRevisions[id][0];
    const draft = initialisePharmacyDraft(sessionCase(id)!, revision), eps = draft.epsPrescription!;
    store().setPharmacyDraft(id, { ...draft, purpose: "new_submission",
      epsPrescription: { ...eps, items: [{ ...eps.items[0], quantity: 56 }] } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r.outcome).not.toBe("COMPLETE");
    expect(r.missing).toContain("Independent claim product and quantity agree");
    expect(r.kernelRecommendation).not.toBe("NONE");
  });

  it("edited draft date resolves its own provision, requirements and kernel input", () => {
    const id = "EX-24107", revision = store().caseRevisions[id][0], draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, purpose: "new_submission",
      epsPrescription: { ...draft.epsPrescription!, dispensingDate: "2026-07-21", prescriptionDate: "2026-07-21" } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r.version).toBe("2026-07");
    expect(r.requirements.some((entry) => entry.id === "dated")).toBe(false);
    expect(r.kernelRecommendation).not.toBe("REFER_BACK");
  });

  it("an unavailable dispensing-date provision is an explicit gap, never a fabricated clause", () => {
    const id = "EX-24107", revision = store().caseRevisions[id][0], draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, epsPrescription: { ...draft.epsPrescription!, dispensingDate: "2027-01-21" } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r).toMatchObject({ clause: null, version: null, outcome: "ABSTAIN", preview: null });
    expect(r.requirements).toContainEqual({ id: "provision", label: "Applicable provision", status: "not_established" });
    expect(r.nextStep).toContain("Request");
  });

  it.each(["", "2026-02-30"])("invalid draft dispensing date %s shows an explicit diagnostic rather than stale success", (date) => {
    const id = "EX-24107", revision = store().caseRevisions[id][0], draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, epsPrescription: { ...draft.epsPrescription!, dispensingDate: date } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r).toMatchObject({ outcome: "ABSTAIN", operatorApplyAllowed: false, preview: null, kernelGate: "NOT_RUN" });
    expect(r.missing.join(" ")).toContain("date");
    expect(r.requirements[0].status).toBe("not_established");
  });

  it("an invalid EPS quantity remains an unvalidated draft, not a page crash", () => {
    const id = "EX-24107", revision = store().caseRevisions[id][0], draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, epsPrescription: { ...draft.epsPrescription!, items: [{ ...draft.epsPrescription!.items[0], quantity: -1 }] } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r).toMatchObject({ outcome: "ABSTAIN", operatorApplyAllowed: false, preview: null, provenance: "Unvalidated human draft" });
  });

  it("missing invoice suggests manual input only and never an amount from the claim", () => {
    const revision = store().caseRevisions["EX-24112"][0], draft = initialisePharmacyDraft(sessionCase("EX-24112")!, revision);
    const suggestions = concreteSuggestions([{ id: "invoice_price", label: "Invoice price stated", status: "not_met" }], draft, null, "2026-08-21");
    expect(suggestions).toEqual([{
      field: "invoice_price", label: "invoice price required; enter £x.xx", value: null, status: "needs-human-input",
      source: "Invoice required; claim amount is not invoice evidence", focusTarget: "invoicePrice",
    }]);
    expect(draft.endorsementText).not.toContain("£");
  });

  it("an existing EPS item accepts an unsupported SP draft for manual invoice guidance without widening kernel coverage", () => {
    const id = "EX-24107", revision = store().caseRevisions[id][0], draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, endorsementText: "SP RK",
      epsPrescription: { ...draft.epsPrescription!, dispenserEndorsement: "SP RK" } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r).toMatchObject({ clause: { id: "P8B-S1" }, outcome: "ABSTAIN", kernelRecommendation: "ABSTAIN",
      kernelGate: "NOT_RUN", operatorApplyAllowed: false, preview: null, signals: { inCoverage: false } });
    expect(r.summary).toContain("Unsupported input");
    expect(r.suggestions).toContainEqual(expect.objectContaining({ field: "invoice_price", value: null,
      label: "invoice price required; enter £x.xx", focusTarget: "invoicePrice", status: "needs-human-input" }));
    expect(store().pharmacyDrafts[id].endorsementText).toBe("SP RK");
    expect(store().itemVerification[id].released).toBe(false);
    store().setAgentEnabled(true);
    for (const text of ["SP RK", "SP RK £3.41"]) {
      store().submitItem({ caseId: id, channel: "eps", endorsementText: text,
        epsPrescription: { ...draft.epsPrescription!, dispenserEndorsement: text } });
      expect(store().itemVerification[id]).toMatchObject({ gate1: "fail", released: false });
      expect(deriveRecommendation(store(), id)).toMatchObject({ outcome: "ABSTAIN", operatorApplyAllowed: false });
    }
  });

  it("paper correction exposes its recorded manufacturer and retains unchanged pack and form", () => {
    const id = "EX-24112", revision = store().caseRevisions[id].at(-1)!, draft = initialisePharmacyDraft(sessionCase(id)!, revision);
    store().setPharmacyDraft(id, { ...draft, paperDeclaration: { ...draft.paperDeclaration!, brandManufacturer: "" } });
    const r = deriveRecommendation(store(), id, { kind: "draft" });
    expect(r.suggestions.map((entry) => [entry.field, entry.value])).toEqual([
      ["brand_manufacturer", "Demo manufacturer (synthetic)"],
    ]);
    expect(r.preview?.paperDeclaration).toMatchObject({ brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21, form: "capsules" });
    expect(r.preview?.appliedFields).toEqual(["brandManufacturer"]);
    store().setAgentEnabled(true);
    store().applySuggestedCorrection(id);
    expect(store().pharmacyDrafts[id].appliedFields).toEqual(["brandManufacturer"]);
    store().setPharmacyDraft(id, { ...store().pharmacyDrafts[id], endorsementText: "" });
    expect(store().pharmacyDrafts[id].appliedFields).toBeUndefined();
  });
});
