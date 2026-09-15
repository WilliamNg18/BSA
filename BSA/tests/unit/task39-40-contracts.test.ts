import { describe, expect, it } from "vitest";
import type { EpsPrescription, PaperDeclaration, DeclaredItemFields } from "../../src/lib/domain/types";
import type { CorrectionAcknowledgement, PharmacyCorrectionDraft, ProcessSubmission } from "../../src/lib/domain/lifecycle";
import { CASES } from "../../src/lib/domain/cases";
import { createEpsPrescription } from "../../src/lib/domain/eps-check";

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
