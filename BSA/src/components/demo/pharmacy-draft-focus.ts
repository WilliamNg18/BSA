import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";

export function focusPharmacyCorrection(before: PharmacyCorrectionDraft, after: PharmacyCorrectionDraft, endorsementId = "endorsement") {
  const supplyFields = [
    ["brandManufacturer", "eps-manufacturer"],
    ["packSize", "eps-pack"],
    ["form", "eps-form"],
  ] as const;
  const changed = supplyFields.find(([field]) =>
    before.epsPrescription?.supplyEvidence?.[field] !== after.epsPrescription?.supplyEvidence?.[field]);
  document.getElementById(changed?.[1] ?? endorsementId)?.focus();
}
