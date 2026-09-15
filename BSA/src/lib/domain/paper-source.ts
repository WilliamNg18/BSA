import type { CaseRevision, PaperSubmissionSource } from "./lifecycle";
import type { DeclaredItemFields, ExceptionCase } from "./types";
import { immutable, paperDeclarationFields } from "./lifecycle-model";
import { productByCode } from "./reference";
import type { CharacterRecognitionField } from "./paper-reconciliation";
import type { ReferralField } from "./referral-wording";

/** Explicit synthetic incoming documents. A new amendment never rewrites the previous scan. */
export function createPaperSubmissionSource(original: ExceptionCase, revision: CaseRevision): PaperSubmissionSource {
  const amendment = revision.kind === "resubmission" && Boolean(revision.correctionAcknowledgement);
  const declared = revision.declaration?.fields ?? (revision.paperDeclaration ? paperDeclarationFields(revision.paperDeclaration) : null);
  const originalFields: DeclaredItemFields = {
    productCode: original.extracted.productCode, quantity: original.extracted.quantity,
    endorsementText: original.extracted.endorsementText, prescriber: original.extracted.prescriber,
    ...(original.paperDeclaration ? {
      brandManufacturer: original.paperDeclaration.brandManufacturer, packSize: original.paperDeclaration.packSize, form: original.paperDeclaration.form,
    } : {}),
  };
  const fields = amendment && declared ? declared : originalFields;
  const date = amendment ? revision.paperDeclaration?.dispensingDate ?? original.extracted.dispensingDate : original.extracted.dispensingDate;
  const scan: ExceptionCase = amendment ? {
    ...original, imageQuality: 0.99, imageStyle: "printed", capturedEvidence: undefined,
    title: "Acknowledged pharmacy amendment (synthetic)",
    extracted: { ...original.extracted, productCode: fields.productCode, quantity: fields.quantity,
      productText: productByCode(fields.productCode)?.name ?? "", endorsementText: fields.endorsementText,
      prescriber: fields.prescriber ?? "", dispensingDate: date,
      productConfidence: 0.99, quantityConfidence: 0.99, endorsementConfidence: 0.99 },
    regions: [
      { id: "item", label: "Resubmitted item", x: 6, y: 34, w: 58, h: 9,
        text: `${productByCode(fields.productCode)?.name ?? "Not supplied"} ${fields.quantity ?? "Not supplied"}`, confidence: 0.99 },
      { id: "endorsement", label: "Resubmitted endorsement", x: 68, y: 34, w: 28, h: 9,
        text: fields.endorsementText, confidence: 0.99 },
      ...(fields.brandManufacturer !== undefined ? [{ id: "brand", label: "Brand or manufacturer", x: 6, y: 48, w: 90, h: 7,
        text: fields.brandManufacturer || "Brand or manufacturer not supplied", confidence: 0.99 }] : []),
      ...(fields.packSize !== undefined ? [{ id: "pack", label: "Pack size", x: 6, y: 57, w: 42, h: 7,
        text: fields.packSize === null ? "Pack size not supplied" : `Pack size ${fields.packSize}`, confidence: 0.99 }] : []),
      ...(fields.form !== undefined ? [{ id: "form", label: "Presentation", x: 52, y: 57, w: 44, h: 7,
        text: fields.form || "Presentation not supplied", confidence: 0.99 }] : []),
    ],
  } : { ...original, capturedEvidence: undefined };
  const fieldEntries: readonly (readonly [ReferralField, string | number | null | undefined])[] = [
    ["productCode", fields.productCode], ["quantity", fields.quantity], ["endorsementText", fields.endorsementText],
    ["prescriber", fields.prescriber], ["dispensingDate", date],
    ...(fields.brandManufacturer !== undefined ? [["brandManufacturer", fields.brandManufacturer] as const] : []),
    ...(fields.packSize !== undefined ? [["packSize", fields.packSize] as const] : []),
    ...(fields.form !== undefined ? [["form", fields.form] as const] : []),
  ];
  const characterRecognition: CharacterRecognitionField[] = fieldEntries.map(([field, value]) => ({
    field, value: value ?? null, confidence: amendment ? 0.99 : field === "dispensingDate" ? 0.99 :
      field === "productCode" ? original.extracted.productConfidence : field === "quantity" ? original.extracted.quantityConfidence :
        field === "endorsementText" ? original.extracted.endorsementConfidence : original.imageQuality,
  }));
  return immutable({ provenance: amendment ? "acknowledged_pharmacy_amendment" : "original_scan", scan, fields, characterRecognition });
}
