import type { Requirement, TariffClause, TariffVersion } from "./types";

// SYNTHETIC, versioned rulebook. The wording below is a demonstration
// paraphrase, not the text of the real Drug Tariff. Three monthly versions
// are held so that the "rule in force on the dispensing date" can be shown
// changing between months (Part II Clause 9 gains "and dated" in August).

const R: Record<string, Requirement> = {
  present: { id: "endorsement_present", label: "Endorsement present" },
  initialled: { id: "initialled", label: "Initialled by or on behalf of the contractor" },
  dated: { id: "dated", label: "Dated" },
  quantity: { id: "quantity_stated", label: "Quantity supplied stated" },
  invoice: { id: "invoice_price", label: "Invoice price stated" },
  manufacturer: { id: "brand_manufacturer", label: "Brand or manufacturer dispensed" },
  pack: { id: "pack_size", label: "Pack size dispensed" },
  presentation: { id: "presentation", label: "Form dispensed" },
};

function clauseSet(withDate: boolean): TariffClause[] {
  return [
    {
      id: "P2-C9",
      part: "Part II",
      title: "Clause 9: No cheaper stock obtainable (NCSO)",
      endorsementType: "NCSO",
      text: withDate
        ? "Dispensing-month concession: endorse NCSO, initialled and dated by or on behalf of the contractor."
        : "Dispensing-month concession: endorse NCSO, initialled by or on behalf of the contractor.",
      requirements: withDate
        ? [R.present, R.initialled, R.dated]
        : [R.present, R.initialled],
    },
    {
      id: "P2-C8",
      part: "Part II",
      title: "Clause 8: Broken bulk (BB)",
      endorsementType: "BB",
      text: "Where a listed product is supplied from a pack larger than the quantity ordered, the item shall be endorsed BB with the quantity supplied stated.",
      requirements: [R.present, R.quantity],
    },
    {
      id: "P2-C12",
      part: "Part II",
      title: "Clause 12: Out-of-pocket expenses (XP)",
      endorsementType: "XP",
      text: "For exceptional product expenses, endorse XP with amount and reason. Above the stated threshold, include the invoice.",
      requirements: [R.present, R.initialled],
    },
    {
      id: "P8B-S1",
      part: "Part VIIIB",
      title: "Specials: invoice price",
      endorsementType: "SP",
      text: "An unlicensed special shall be endorsed with the invoice price, the manufacturer's licence number and the quantity supplied.",
      requirements: [R.present, R.invoice, R.quantity],
    },
    {
      id: "SYN-EPS-SUPPLY",
      part: "Synthetic supply rules",
      title: "Generic supply evidence",
      endorsementType: "SUPPLY",
      text: "Synthetic generic supply: state the brand or manufacturer dispensed, pack size and form. These demonstration requirements are not clinical guidance.",
      requirements: [R.manufacturer, R.pack, R.presentation],
    },
    {
      id: "SYN-EPS-STRENGTH", part: "Synthetic EPS rules", title: "Endorsed pack matches prescription and supply",
      endorsementType: "SUPPLY",
      text: "Reimbursement follows the endorsed pack; the selected product and strength must match the prescription and the product supplied.",
      requirements: [{ id: "selected_pack_matches", label: "Selected product and strength match prescription and supply" }],
    },
  ];
}

export const TARIFF_VERSIONS: TariffVersion[] = [
  {
    version: "2026-07",
    label: "July 2026",
    effectiveFrom: "2026-07-01",
    effectiveTo: "2026-07-31",
    changeNote: "Baseline wording. NCSO endorsement requires initials only.",
    clauses: clauseSet(false),
    concessions: [
      { productCode: "SYN-SERT50-28", price: 3.12 },
      { productCode: "SYN-METF500-56", price: 2.4 },
    ],
  },
  {
    version: "2026-08",
    label: "August 2026",
    effectiveFrom: "2026-08-01",
    effectiveTo: "2026-08-31",
    changeNote: "Clause 9 amended: NCSO endorsement must now be initialled AND dated. New concessions added for amlodipine and sertraline.",
    clauses: clauseSet(true),
    concessions: [
      { productCode: "SYN-SERT50-28", price: 3.41 },
      { productCode: "SYN-AMLO10-28", price: 2.95 },
      { productCode: "SYN-METF500-56", price: 2.6 },
    ],
  },
  {
    version: "2026-09",
    label: "September 2026",
    effectiveFrom: "2026-09-01",
    effectiveTo: "2026-09-30",
    changeNote: "No change to Clause 9. Amlodipine concession withdrawn.",
    clauses: clauseSet(true),
    concessions: [{ productCode: "SYN-SERT50-28", price: 3.2 }],
  },
];

export function versionForDate(isoDate: string): TariffVersion | null {
  // Compare canonical calendar dates only, never partial dates or timestamps.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) return null;
  return (
    TARIFF_VERSIONS.find(
      (v) => isoDate >= v.effectiveFrom && isoDate <= v.effectiveTo,
    ) ?? null
  );
}

export function versionById(version: string): TariffVersion | null {
  return TARIFF_VERSIONS.find((v) => v.version === version) ?? null;
}
