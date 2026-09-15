import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";

export function focusPharmacyCorrection(before: PharmacyCorrectionDraft, after: PharmacyCorrectionDraft, endorsementId = "endorsement") {
  if (before.epsPrescription?.items[0]?.dispensedCode !== after.epsPrescription?.items[0]?.dispensedCode) {
    document.getElementById("eps-selected-pack")?.focus();
    return;
  }
  const paperField = (["typedProduct", "quantity", "brandManufacturer", "packSize", "form"] as const)
    .find((field) => before.paperDeclaration?.[field] !== after.paperDeclaration?.[field]);
  if (paperField) {
    document.getElementById(`paper-${paperField}`)?.focus();
    return;
  }
  const supplyFields = [
    ["brandManufacturer", "eps-manufacturer"],
    ["packSize", "eps-pack"],
    ["form", "eps-form"],
  ] as const;
  const changed = supplyFields.find(([field]) =>
    before.epsPrescription?.supplyEvidence?.[field] !== after.epsPrescription?.supplyEvidence?.[field]);
  document.getElementById(changed?.[1] ?? endorsementId)?.focus();
}
