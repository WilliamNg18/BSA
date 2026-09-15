import type { PharmacyCorrectionDraft } from "./lifecycle";
import type { ConcreteSuggestion, RecommendationRequirement } from "./recommendations";

/** Values are taken only from the shared prepared patch; missing invoice evidence stays human input. */
export function concreteSuggestions(
  requirements: readonly RecommendationRequirement[], before: PharmacyCorrectionDraft,
  preview: PharmacyCorrectionDraft | null, dispensingDate: string,
): ConcreteSuggestion[] {
  const suggestions: ConcreteSuggestion[] = [];
  const beforeItem = before.epsPrescription?.items[0], afterItem = preview?.epsPrescription?.items[0];
  if (afterItem && beforeItem?.dispensedCode !== afterItem.dispensedCode) suggestions.push({
    field: "selected_pack_matches", label: "Select the pack supplied", value: `${afterItem.dispensedName}, ${afterItem.quantity}`,
    status: "available", source: "Pharmacy prescription and actual supply records", focusTarget: "dispensedCode",
  });
  if (preview?.paperDeclaration && before.paperDeclaration?.typedProduct !== preview.paperDeclaration.typedProduct) suggestions.push({
    field: "product", label: "Product supplied", value: preview.paperDeclaration.typedProduct,
    status: "available", source: "Pharmacy supply record", focusTarget: "typedProduct",
  });
  if (preview?.paperDeclaration && before.paperDeclaration?.quantity !== preview.paperDeclaration.quantity) suggestions.push({
    field: "quantity_stated", label: "Quantity supplied", value: preview.paperDeclaration.quantity,
    status: "available", source: "Pharmacy supply record", focusTarget: "quantity",
  });
  if (preview && preview.endorsementText !== before.endorsementText) suggestions.push({
    field: "dated", label: "Add the dispensing date beside the initials",
    value: dispensingDate.split("-").reverse().join("/"), status: "available", source: "Dispensing date", focusTarget: "endorsementText",
  });
  const beforeSupply = before.epsPrescription?.supplyEvidence ?? before.paperDeclaration;
  const afterSupply = preview?.epsPrescription?.supplyEvidence ?? preview?.paperDeclaration;
  if (afterSupply) for (const [field, key, label] of [
    ["brand_manufacturer", "brandManufacturer", "Brand or manufacturer"],
    ["pack_size", "packSize", "Pack size"],
    ["presentation", "form", "Form dispensed"],
  ] as const) {
    if (afterSupply[key] !== undefined && beforeSupply?.[key] !== afterSupply[key]) suggestions.push({
      field, label, value: afterSupply[key], status: "available", source: "Synthetic product supply record", focusTarget: key,
    });
  }
  if (requirements.some((entry) => entry.id === "invoice_price" && entry.status !== "met")) suggestions.push({
    field: "invoice_price", label: "invoice price required; enter £x.xx", value: null, status: "needs-human-input",
    source: "Invoice required; claim amount is not invoice evidence", focusTarget: "invoicePrice",
  });
  return suggestions;
}
