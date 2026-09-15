import { describe, expect, it } from "vitest";
import type { EpsPrescription, PaperDeclaration, DeclaredItemFields } from "../../src/lib/domain/types";
import type { CorrectionAcknowledgement, PharmacyCorrectionDraft, ProcessSubmission } from "../../src/lib/domain/lifecycle";
import { CASES } from "../../src/lib/domain/cases";
import { createEpsPrescription } from "../../src/lib/domain/eps-check";
import { paperDeclarationFields, validateRetainedEpsSources, validateSubmissionSources } from "../../src/lib/domain/lifecycle-model";
import { sameDeclaredFields } from "../../src/lib/domain/capture-evidence";
import { synchronisePharmacyDraft } from "../../src/lib/domain/pharmacy-correction";
import { seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";

describe("Tasks 39/40 additive domain contracts", () => {
  it("represents prescribed, supplied and selected codes independently", () => {
    const original = createEpsPrescription(CASES[1]);
    const claim: EpsPrescription = {
      ...original, supplyRecord: { productCode: "SYN-AMLO10-28", quantity: 28 },
      items: [{ ...original.items[0], dispensedCode: "SYN-AMLO5-28", dispensedName: "Amlodipine 5mg tablets" }],
    };
    expect(claim.items[0].prescribedCode).toBe("SYN-AMLO10-28");
    expect(claim.items[0].strength).toBe("10mg");
    expect(claim.supplyRecord).toEqual({ productCode: "SYN-AMLO10-28", quantity: 28 });
    expect(claim.items[0].dispensedCode).toBe("SYN-AMLO5-28");
    expect(original.items[0].dispensedCode).toBe("SYN-AMLO10-28");
    expect(() => validateSubmissionSources({ caseId: "SYN-FQ123-MISMATCH", channel: "eps",
      endorsementText: claim.dispenserEndorsement, epsPrescription: { ...claim, claimMessageState: "submitted" } }, 1)).not.toThrow();
    const corrected = { ...claim, items: [{ ...claim.items[0], dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets" }] };
    expect(() => validateRetainedEpsSources(claim, corrected)).not.toThrow();
    expect(() => validateRetainedEpsSources(claim, { ...corrected,
      prescriber: { practice: corrected.prescriber.practice, name: corrected.prescriber.name },
      supplyRecord: { quantity: 28, productCode: "SYN-AMLO10-28" } })).not.toThrow();
    expect(() => validateRetainedEpsSources(claim, { ...corrected, supplyRecord: { productCode: "SYN-AMLO5-28", quantity: 28 } })).toThrow("original prescription");
    expect(() => validateRetainedEpsSources(claim, { ...corrected, supplyRecord: undefined })).toThrow("retained");
    expect(() => validateRetainedEpsSources(claim, { ...corrected, items: [{ ...corrected.items[0], quantity: 56 }] })).toThrow("original prescription");
  });

  it("carries paper supply facts without making them a scan reading", () => {
    const paper: PaperDeclaration = {
      typedProduct: "SYN-AMOX500-GENERIC-21", quantity: 21, endorsementText: "NCSO RK 21/08/26",
      dispensingDate: "2026-08-21", declaredByPharmacy: true, brandManufacturer: "", packSize: 21, form: "capsules",
    };
    const captured: DeclaredItemFields = {
      productCode: paper.typedProduct, quantity: paper.quantity, endorsementText: paper.endorsementText,
      brandManufacturer: "Separately confirmed synthetic supplier", packSize: 21, form: "capsules",
    };
    expect(paper.brandManufacturer).toBe("");
    expect(captured.brandManufacturer).not.toBe(paper.brandManufacturer);
    expect(paperDeclarationFields(paper)).toMatchObject({ brandManufacturer: "", packSize: 21, form: "capsules" });
    const revision = seededLifecycleSession().caseRevisions["EX-24123"][0];
    const draft = synchronisePharmacyDraft({ revision: 1, channel: "paper", endorsementText: paper.endorsementText, paperDeclaration: paper }, revision);
    expect(draft.declaration?.fields).toMatchObject({ brandManufacturer: "", packSize: 21, form: "capsules" });
    expect(sameDeclaredFields(captured, { ...captured, brandManufacturer: "" })).toBe(false);
    expect(() => validateSubmissionSources({ caseId: "EX-24112", channel: "paper", endorsementText: paper.endorsementText,
      paperDeclaration: paper, declaration: { fields: captured, declaredAt: revision.at, provenance: "pharmacy_declaration" } }, 1)).toThrow("copies do not match");
  });

  it("carries revision-bound acknowledgement through draft and submission without changing existing signatures", () => {
    const acknowledgement: CorrectionAcknowledgement = { revision: 2, fingerprint: '{"payload":"exact"}' };
    const draft: PharmacyCorrectionDraft = {
      revision: 2, purpose: "correction", channel: "eps", endorsementText: "NCSO RK 21/08/26",
      appliedSuggestion: false, correctionAcknowledgement: acknowledgement, appliedFields: ["dispensedCode"],
    };
    const submission: ProcessSubmission = { ...draft, caseId: "SYN-FQ123-MISMATCH", channel: "eps" };
    expect(submission.correctionAcknowledgement).toEqual(acknowledgement);
    expect(submission.revision).toBe(acknowledgement.revision);
  });
});
