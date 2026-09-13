import type { ConfirmType1Input } from "./lifecycle";
import type { PharmacyDeclaration } from "./types";

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
}: Omit<ConfirmType1Input, "fields"> & { fields: PaperCaptureDraft }): PaperCapturePreparation {
  const errors: NonNullable<PaperCapturePreparation["errors"]> = {};
  const quantityText = fields.quantity.trim();
  const quantity = quantityText === "" ? null : Number(quantityText);
  if (quantity !== null && (!/^\d+$/.test(quantityText) || !Number.isSafeInteger(quantity) || quantity <= 0)) {
    errors.quantity = "Enter a positive whole quantity, or leave blank if unreadable.";
  }
  if (provenance === "pharmacy_declaration" && !declarationReconciled) {
    errors.declarationReconciled = "Reconcile the declaration with the paper, or use manual capture.";
  }
  if (Object.keys(errors).length) return { input: null, errors };
  return {
    input: {
      caseId,
      revision,
      fields: {
        productCode: fields.productCode.trim() || null,
        quantity,
        endorsementText: fields.endorsementText.trim(),
        prescriber: fields.prescriber.trim() || null,
      },
      provenance,
      declarationReconciled: provenance === "pharmacy_declaration" && declarationReconciled,
    },
    errors: null,
  };
}
