import { describe, expect, it } from "vitest";
import { PAPER_DECLARATION_PROVENANCE, prepareCaptureConfirmation, preparePaperCapture } from "../../src/lib/domain/paper-capture";
import type { PharmacyDeclaration } from "../../src/lib/domain/types";

const declaration: PharmacyDeclaration = Object.freeze({
  fields: Object.freeze({ productCode: "SYN-001", quantity: 28, endorsementText: "NCSO AB 12/08/2026", prescriber: "Dr Demo (synthetic)" }),
  declaredAt: "2026-08-12T09:00:00Z",
  provenance: "pharmacy_declaration",
});
const context = { caseId: "EX-24123", revision: 2 };

describe("paper capture presentation, not evidence authority", () => {
  it("leaves manual capture empty even when a declaration exists", () => {
    expect(preparePaperCapture(false, declaration)).toEqual({
      fields: { productCode: "", quantity: "", endorsementText: "", prescriber: "" }, provenance: "human_capture",
    });
    expect(preparePaperCapture(true)).toEqual(preparePaperCapture(false, declaration));
  });

  it("prefills only the attributed immutable declaration without confirming anything", () => {
    const prepared = preparePaperCapture(true, declaration);
    expect(prepared).toEqual({
      fields: { productCode: "SYN-001", quantity: "28", endorsementText: "NCSO AB 12/08/2026", prescriber: "Dr Demo (synthetic)" },
      provenance: "pharmacy_declaration",
    });
    prepared.fields.endorsementText = "Human correction";
    expect(declaration.fields.endorsementText).toBe("NCSO AB 12/08/2026");
    expect(PAPER_DECLARATION_PROVENANCE).toBe("declared by the pharmacy, not read from the form");
  });

  it("does not invent missing declaration fields", () => {
    expect(preparePaperCapture(true, { ...declaration, fields: { productCode: null, quantity: null, endorsementText: "" } }).fields)
      .toEqual({ productCode: "", quantity: "", endorsementText: "", prescriber: "" });
  });

  it("requires a separate explicit human reconciliation for declared fields", () => {
    const prepared = preparePaperCapture(true, declaration);
    expect(prepareCaptureConfirmation({ ...context, ...prepared, declarationReconciled: false })).toEqual({
      input: null, errors: { declarationReconciled: "Reconcile the declaration with the paper, or use manual capture." },
    });
    expect(prepareCaptureConfirmation({ ...context, ...prepared, declarationReconciled: true }).input)
      .toEqual({ ...context, fields: declaration.fields, provenance: "pharmacy_declaration", declarationReconciled: true });
  });

  it("keeps manual unknowns explicit for authoritative downstream routing", () => {
    expect(prepareCaptureConfirmation({
      ...context, ...preparePaperCapture(false), declarationReconciled: true,
    }).input).toEqual({
      ...context, fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null },
      provenance: "human_capture", declarationReconciled: false,
    });
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "1e2", "0x10", "9007199254740992", "two"])(
    "rejects invalid quantity %s rather than silently substituting a value", (quantity) => {
      const result = prepareCaptureConfirmation({
        ...context, ...preparePaperCapture(true, declaration),
        fields: { productCode: "SYN-001", quantity, endorsementText: "", prescriber: "" },
        declarationReconciled: true,
      });
      expect(result.input).toBeNull();
      expect(result.errors?.quantity).toBeTruthy();
    },
  );

  it("prepares corrected fields without altering the submission or granting authority", () => {
    expect(prepareCaptureConfirmation({
      ...context, provenance: "pharmacy_declaration", declarationReconciled: true,
      fields: { productCode: " SYN-002 ", quantity: " 56 ", endorsementText: " human correction ", prescriber: " Dr Demo (synthetic) " },
    }).input).toEqual({
      ...context, provenance: "pharmacy_declaration", declarationReconciled: true,
      fields: { productCode: "SYN-002", quantity: 56, endorsementText: "human correction", prescriber: "Dr Demo (synthetic)" },
    });
    expect(declaration.fields.quantity).toBe(28);
  });
});
