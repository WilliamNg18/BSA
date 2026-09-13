import type { HistoryRecord, Product } from "./types";

// SYNTHETIC reference data standing in for NHSBSA source systems.
// Product codes are invented (SYN-…) and do not correspond to dm+d codes.

export const PRODUCTS: Product[] = [
  { code: "SYN-SERT50-28", name: "Sertraline 50mg tablets", packSize: 28, category: "M", basicPrice: 1.27 },
  { code: "SYN-AMLO10-28", name: "Amlodipine 10mg tablets", packSize: 28, category: "M", basicPrice: 0.98 },
  { code: "SYN-METF500-56", name: "Metformin 500mg tablets", packSize: 56, category: "M", basicPrice: 1.53 },
  { code: "SYN-COCOD-100", name: "Co-codamol 30/500 tablets", packSize: 100, category: "M", basicPrice: 3.86 },
  { code: "SYN-AMOX500-21", name: "Amoxicillin 500mg capsules", packSize: 21, category: "M", basicPrice: 1.02 },
  { code: "SYN-LEVO100-28", name: "Levothyroxine 100mcg tablets", packSize: 28, category: "M", basicPrice: 1.12 },
];

export function productByCode(code: string | null): Product | null {
  if (!code) return null;
  return PRODUCTS.find((p) => p.code === code) ?? null;
}

/** Fuzzy product search used when extraction is uncertain. Returns candidates. */
export function productCandidates(text: string): Product[] {
  const t = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return PRODUCTS.filter((p) => {
    const n = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return n.startsWith(t.slice(0, 4)) || t.startsWith(n.slice(0, 4));
  });
}

export const HISTORY: HistoryRecord[] = [
  { contractorCode: "FQ123", referralsLast90Days: 3, lastReasons: ["NCSO not dated", "NCSO not dated", "Quantity mismatch"], quantityMismatchesLast90Days: 1 },
  { contractorCode: "FH774", referralsLast90Days: 1, lastReasons: ["Missing endorsement"], quantityMismatchesLast90Days: 0 },
  { contractorCode: "FM208", referralsLast90Days: 5, lastReasons: ["Quantity mismatch", "Quantity mismatch", "NCSO not dated"], quantityMismatchesLast90Days: 2 },
  { contractorCode: "FT561", referralsLast90Days: 0, lastReasons: [], quantityMismatchesLast90Days: 0 },
  { contractorCode: "FK390", referralsLast90Days: 2, lastReasons: ["Illegible endorsement", "Missing endorsement"], quantityMismatchesLast90Days: 0 },
];

export function historyFor(code: string): HistoryRecord {
  return (
    HISTORY.find((h) => h.contractorCode === code) ?? {
      contractorCode: code,
      referralsLast90Days: 0,
      lastReasons: [],
      quantityMismatchesLast90Days: 0,
    }
  );
}

export const HILLCREST_PHARMACY = Object.freeze({
  name: "Hillcrest Pharmacy", contractorCode: "FQ123", town: "Synthetic town",
});

export const PHARMACIES = [HILLCREST_PHARMACY];

/** Display-only queue context, never selectable or part of the operational store. */
export const BACKGROUND_PHARMACIES = [
  { name: "Riverside Chemist", contractorCode: "FH774", town: "Synthetic town" },
  { name: "Oakfield Pharmacy", contractorCode: "FM208", town: "Synthetic town" },
  { name: "Station Road Pharmacy", contractorCode: "FT561", town: "Synthetic town" },
  { name: "Meadow Lane Dispensary", contractorCode: "FK390", town: "Synthetic town" },
];
