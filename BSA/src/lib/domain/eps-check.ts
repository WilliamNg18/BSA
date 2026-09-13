import { productByCode } from "./reference";
import { versionForDate } from "./tariff";
import type { EpsPrescription, ExceptionCase } from "./types";

export const EPS_SUPPLY_RULE = Object.freeze({
  id: "SYN-EPS-SUPPLY" as const,
  productCode: "SYN-AMOX500-GENERIC-21",
  brandManufacturer: "Demo manufacturer (synthetic)",
  packSize: 21,
  form: "capsules",
  text: "Synthetic generic supply: state the brand or manufacturer dispensed, pack size and form. These demonstration requirements are not clinical guidance.",
});

interface SupplyEvidence {
  readonly ruleId: "SYN-EPS-SUPPLY";
  readonly brandManufacturer: string;
  readonly packSize: number | null;
  readonly form: string;
}

/** Pure source-field checks, shared by advice, routing and the compliance gate. */
export function evaluateEpsSupply(prescription: Pick<EpsPrescription, "items" | "dispensingDate"> & { readonly supplyEvidence?: SupplyEvidence }) {
  const evidence = prescription.supplyEvidence;
  const item = prescription.items[0];
  const applicable = prescription.items.some((entry) => entry.dispensedCode === EPS_SUPPLY_RULE.productCode || entry.prescribedCode === EPS_SUPPLY_RULE.productCode);
  if (!applicable && !evidence) return null;
  const version = versionForDate(prescription.dispensingDate);
  const checks = [
    { id: "supply_product", label: "Product covered by the synthetic supply rule", met: evidence?.ruleId === EPS_SUPPLY_RULE.id && prescription.items.length === 1 && item?.dispensedCode === EPS_SUPPLY_RULE.productCode },
    { id: "supply_version", label: "Dispensing-month synthetic rule available", met: version !== null },
    { id: "brand_manufacturer", label: "Brand or manufacturer dispensed", met: (evidence?.brandManufacturer.trim().length ?? 0) > 0 },
    { id: "pack_size", label: "Pack size dispensed", met: evidence?.packSize === EPS_SUPPLY_RULE.packSize },
    { id: "presentation", label: "Form dispensed", met: evidence?.form.trim().toLowerCase() === EPS_SUPPLY_RULE.form },
  ];
  return {
    ruleId: EPS_SUPPLY_RULE.id,
    version: version?.version ?? null,
    checks,
    complete: checks.every((check) => check.met),
    gap: checks.filter((check) => !check.met).map((check) => check.label).join(", ") || "None",
  };
}

/** Explicit synthetic draft, never a fallback for missing historical evidence. */
export function createEpsPrescription(c: ExceptionCase): EpsPrescription {
  const product = productByCode(c.extracted.productCode);
  if (!product || c.extracted.quantity === null) throw new Error("A known synthetic product and quantity are required for an EPS draft.");
  const match = /^(.*?)\s+([\d/]+(?:mg|mcg)?)\s+(tablets|capsules)(?: \(generic synthetic\))?$/.exec(product.name);
  if (!match) throw new Error("Synthetic product presentation is not configured.");
  return {
    prescriber: { name: c.extracted.prescriber, practice: "Hillcrest Practice (synthetic)" },
    patientLabel: c.patientLabel,
    prescriptionDate: c.extracted.dispensingDate,
    dispensingDate: c.extracted.dispensingDate,
    items: [{
      prescribedCode: product.code, product: match[1], strength: match[2], form: match[3],
      quantity: c.extracted.quantity, dose: "Synthetic placeholder only; not clinical advice",
      dispensedCode: product.code, dispensedName: product.name,
    }],
    prescriberEndorsement: "",
    dispenserEndorsement: c.extracted.endorsementText,
    exemptionStatus: "exempt",
    claimMessageState: "draft",
  };
}
