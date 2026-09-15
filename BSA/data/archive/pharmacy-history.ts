/** Historical pharmacy evidence, unchanged by active demonstration scope. */
import type { HistoryRecord } from "../../src/lib/domain/types";

export const HISTORICAL_PHARMACY_HISTORY: HistoryRecord[] = [
  { contractorCode: "FQ123", referralsLast90Days: 3, lastReasons: ["NCSO not dated", "NCSO not dated", "Quantity mismatch"], quantityMismatchesLast90Days: 1 },
  { contractorCode: "FH774", referralsLast90Days: 1, lastReasons: ["Missing endorsement"], quantityMismatchesLast90Days: 0 },
  { contractorCode: "FM208", referralsLast90Days: 5, lastReasons: ["Quantity mismatch", "Quantity mismatch", "NCSO not dated"], quantityMismatchesLast90Days: 2 },
  { contractorCode: "FT561", referralsLast90Days: 0, lastReasons: [], quantityMismatchesLast90Days: 0 },
  { contractorCode: "FK390", referralsLast90Days: 2, lastReasons: ["Illegible endorsement", "Missing endorsement"], quantityMismatchesLast90Days: 0 },
];
