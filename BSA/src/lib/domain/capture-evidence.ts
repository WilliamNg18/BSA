import type { DeclaredItemFields, ExceptionCase, ExtractedFields } from "./types";
import { productByCode } from "./reference";
import { caseById } from "./cases";

/** Declaration dates select rules, but must not be painted onto the retained scan. */
export function paperImageEvidence(c: ExceptionCase, templateCaseId = c.id): ExceptionCase {
  if (!c.paperDeclaration) return c;
  const source = caseById(templateCaseId);
  if (!source) throw new Error("Original paper image evidence is unavailable.");
  return { ...c, extracted: { ...source.extracted }, regions: source.regions, imageQuality: source.imageQuality, imageStyle: source.imageStyle };
}

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

export function capturedFieldsMatchSources(c: ExceptionCase): boolean {
  const capture = c.capturedEvidence;
  return Boolean(capture && productByCode(capture.fields.productCode) &&
    capture.fields.productCode === c.claim.productCode && capture.fields.quantity === c.claim.quantity &&
    (c.extracted.productCode === null || c.extracted.productCode === capture.fields.productCode) &&
    (c.extracted.quantity === null || c.extracted.quantity === capture.fields.quantity));
}

export function compatibleCapture(c: ExceptionCase): boolean {
  return Boolean(c.capturedEvidence?.declarationReconciled && capturedFieldsMatchSources(c));
}

export function validateDeclaredFields(fields: DeclaredItemFields): void {
  if (!fields || typeof fields !== "object" ||
    fields.productCode !== null && (typeof fields.productCode !== "string" || !fields.productCode.trim()) ||
    fields.quantity !== null && (!Number.isSafeInteger(fields.quantity) || fields.quantity <= 0) ||
    typeof fields.endorsementText !== "string" ||
    fields.prescriber !== undefined && fields.prescriber !== null && typeof fields.prescriber !== "string" ||
    fields.brandManufacturer !== undefined && typeof fields.brandManufacturer !== "string" ||
    fields.form !== undefined && typeof fields.form !== "string" ||
    fields.packSize !== undefined && fields.packSize !== null && (!Number.isSafeInteger(fields.packSize) || fields.packSize <= 0)) {
    throw new Error("Invalid declared or captured fields.");
  }
}

export function sameDeclaredFields(a: DeclaredItemFields, b: DeclaredItemFields): boolean {
  return a.productCode?.trim() === b.productCode?.trim() && a.quantity === b.quantity &&
    a.endorsementText.trim() === b.endorsementText.trim() && (a.prescriber?.trim() ?? "") === (b.prescriber?.trim() ?? "") &&
    a.brandManufacturer === b.brandManufacturer && a.packSize === b.packSize && a.form === b.form;
}
