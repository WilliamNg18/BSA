import type { ExceptionCase, ExtractedFields } from "./types";
import { productByCode } from "./reference";

/** An explicit human capture is distinct from, and never repairs, source imagery. */
export function capturedFields(c: ExceptionCase): ExtractedFields {
  const capture = c.capturedEvidence;
  if (!capture) return c.extracted;
  const { fields } = capture;
  return {
    ...c.extracted, productCode: fields.productCode, quantity: fields.quantity, endorsementText: fields.endorsementText,
    productText: productByCode(fields.productCode)?.name ?? c.extracted.productText,
    prescriber: fields.prescriber?.trim() || c.extracted.prescriber,
  };
}

export function compatibleCapture(c: ExceptionCase): boolean {
  const capture = c.capturedEvidence;
  return Boolean(capture?.declarationReconciled && productByCode(capture.fields.productCode) &&
    capture.fields.productCode === c.claim.productCode && capture.fields.quantity === c.claim.quantity &&
    (c.extracted.productCode === null || c.extracted.productCode === capture.fields.productCode) &&
    (c.extracted.quantity === null || c.extracted.quantity === capture.fields.quantity));
}
