import type { ConfirmType1Input } from "./lifecycle";
import type { DeclaredItemFields, PharmacyDeclaration } from "./types";

export const PAPER_DECLARATION_PROVENANCE = "declared by the pharmacy, not read from the form";

export interface PaperCaptureDraft {
  productCode: string;
  quantity: string;
  endorsementText: string;
  prescriber: string;
}

export interface PreparedPaperCapture {
  fields: PaperCaptureDraft;
  provenance: ConfirmType1Input["provenance"];
}

/** Prepares an editable draft, never evidence authority or human reconciliation. */
export function preparePaperCapture(
  agentEnabled: boolean,
  declaration?: PharmacyDeclaration,
): PreparedPaperCapture {
  if (!agentEnabled || !declaration) {
    return { fields: { productCode: "", quantity: "", endorsementText: "", prescriber: "" }, provenance: "human_capture" };
  }
  return {
    fields: {
      productCode: declaration.fields.productCode ?? "",
      quantity: declaration.fields.quantity?.toString() ?? "",
      endorsementText: declaration.fields.endorsementText,
      prescriber: declaration.fields.prescriber ?? "",
    },
    provenance: "pharmacy_declaration",
  };
}

export type PaperCapturePreparation =
  | { input: ConfirmType1Input; errors: null }
  | { input: null; errors: Partial<Record<keyof PaperCaptureDraft | "declarationReconciled", string>> };

export function prepareCaptureConfirmation({
  caseId,
  revision,
  fields,
  provenance,
  declarationReconciled,
  declaration,
}: Omit<ConfirmType1Input, "fields"> & { fields: PaperCaptureDraft; declaration?: PharmacyDeclaration }): PaperCapturePreparation {
  const errors: NonNullable<PaperCapturePreparation["errors"]> = {};
  const quantityText = fields.quantity.trim();
  const quantity = quantityText === "" ? null : Number(quantityText);
  if (quantity !== null && (!/^\d+$/.test(quantityText) || !Number.isSafeInteger(quantity) || quantity <= 0)) {
    errors.quantity = "Enter a positive whole quantity, or leave blank if unreadable.";
  }
  if (provenance === "pharmacy_declaration" && !declarationReconciled) {
    errors.declarationReconciled = "Reconcile the declaration with the paper, or use manual capture.";
  }
  if (provenance === "pharmacy_declaration" && !declaration) {
    errors.declarationReconciled = "The original pharmacy declaration is unavailable. Use manual capture.";
  }
  if (Object.keys(errors).length) return { input: null, errors };
  const capturedFields: DeclaredItemFields = {
    productCode: fields.productCode.trim() || null,
    quantity,
    endorsementText: fields.endorsementText.trim(),
    prescriber: fields.prescriber.trim() || null,
  };
  const unchangedDeclaration = declaration &&
    capturedFields.productCode === declaration.fields.productCode &&
    capturedFields.quantity === declaration.fields.quantity &&
    capturedFields.endorsementText === declaration.fields.endorsementText &&
    capturedFields.prescriber === (declaration.fields.prescriber ?? null);
  return {
    input: {
      caseId,
      revision,
      fields: capturedFields,
      provenance: provenance === "pharmacy_declaration" && unchangedDeclaration ? "pharmacy_declaration" : "human_capture",
      declarationReconciled: provenance === "pharmacy_declaration" && declarationReconciled,
    },
    errors: null,
  };
}
