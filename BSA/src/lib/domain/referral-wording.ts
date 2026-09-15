export const PHARMACY_SUGGESTION_LABEL = "your agent's suggestion from your records";

export const REFERRAL_FIELD_LABELS = {
  productCode: "Product",
  strength: "Strength",
  quantity: "Quantity",
  endorsementText: "Endorsement",
  dispensingDate: "Dispensing date",
  prescriber: "Prescriber",
  brandManufacturer: "Brand or manufacturer",
  packSize: "Pack size",
  form: "Presentation",
  amountClaimed: "Amount claimed",
} as const;

export type ReferralField = keyof typeof REFERRAL_FIELD_LABELS;
export type ReferralRequest =
  | { readonly rule: "strength_matches_prescription" }
  | { readonly rule: "quantity_matches_prescription" }
  | { readonly rule: "brand_required_for_multiple_suppliers" }
  | { readonly rule: "amount_matches_concession"; readonly tariffMonth: string }
  | { readonly rule: "endorsement_initialled_and_dated" }
  | { readonly rule: "required_field" | "sources_must_agree"; readonly field: ReferralField }
  | { readonly rule: "readable_evidence_required" };

function fieldLabel(field: ReferralField): string {
  if (!Object.hasOwn(REFERRAL_FIELD_LABELS, field)) throw new Error("Unknown referral field.");
  return REFERRAL_FIELD_LABELS[field];
}

function referralSentence(request: ReferralRequest): string {
  switch (request.rule) {
    case "strength_matches_prescription":
      return "Selected strength does not match the prescription and supplied product; please state the accurate product and strength";
    case "quantity_matches_prescription":
      return "Quantity claimed does not match the prescription; please state the accurate quantity";
    case "brand_required_for_multiple_suppliers":
      return "Brand or manufacturer required for a generic with more than one supplier; please state the product supplied";
    case "amount_matches_concession": {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(request.tariffMonth)) throw new Error("A valid dispensing-month Tariff reference is required.");
      const month = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${request.tariffMonth}-01T00:00:00.000Z`));
      return `Amount claimed does not match the concession price for ${month}; please state the accurate amount`;
    }
    case "endorsement_initialled_and_dated":
      return "The retrieved Tariff requires the endorsement to be initialled and dated; please provide a complete and accurate endorsement";
    case "required_field":
      return `${fieldLabel(request.field)} is required by the retrieved Tariff; please state the accurate information`;
    case "sources_must_agree":
      return `${fieldLabel(request.field)} must agree across the declaration, prescription and supplied product; please state the accurate information`;
    case "readable_evidence_required":
      return "Readable source evidence is required before reconciliation; please provide readable evidence for operator comparison";
    default:
      throw new Error("Unknown referral rule.");
  }
}

/** Only field/rule identifiers enter this generator; source facts stay in the evidence block. */
export function buildReferralNote(requests: readonly ReferralRequest[]): string {
  if (!requests.length) throw new Error("A referral must identify a field and rule.");
  return [...new Set(requests.map(referralSentence))].join(". ");
}

function compact(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-GB").replace(/[^\p{L}\p{N}]/gu, "");
}

/** Validate every outbound human note at the final action; never silently rewrite it. */
export function assertSafeOperatorNote(note: string, protectedValues: readonly string[]): void {
  if (typeof note !== "string" || note.trim().length < 8) throw new Error("The operator note requires at least eight characters.");
  const normalised = compact(note);
  for (const value of protectedValues) {
    if (typeof value !== "string" || !compact(value)) throw new Error("A proposed-value guard requires a non-empty source value.");
    if (normalised.includes(compact(value))) {
      throw new Error("The operator note contains a proposed corrected value. Name the field and rule, and ask the pharmacy for accurate information instead.");
    }
  }
}
