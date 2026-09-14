/** Immutable historical evidence, not active production service configuration. */
import type { LifecycleDecisionRecord } from "../../src/lib/domain/lifecycle";
import { immutable } from "../../src/lib/domain/lifecycle-model";

export const HISTORICAL_DECISION_RECORDS = immutable<LifecycleDecisionRecord[]>([
  {
    id: "DR-000871",
    caseId: "EX-24088",
    timestamp: "2026-09-03T15:02:11",
    tariffVersion: "2026-08",
    agentVersion: "prototype-0.5 (interpretation step mocked; production: constrained Azure OpenAI call)",
    inputs: ["Extracted fields (product, quantity 28, endorsement \"NCSO  DL\")", "Claim: qty 28, £3.41, EPS claim message", "Image EX-24088.tif, endorsement region, read confidence 0.84"],
    sources: ["Existing capture", "Claim ledger", "Product master data", "Drug Tariff corpus 2026-08 (Part II, Clause 9)", "Case history FQ123"],
    checks: [
      { name: "Recommendation cites a validated provision", pass: true, detail: "Part II Clause 9, August 2026" },
      { name: "Mandatory fields present", pass: true, detail: "All mandatory fields read" },
      { name: "Agent has not priced or disposed", pass: true, detail: "Recommendation only" },
      { name: "At least one requirement is unmet", pass: true, detail: "Dated: not met" },
    ],
    recommendation: "REFER_BACK",
    decision: "REFER_BACK",
    isOverride: false,
    overrideReason: null,
    operator: "Operator P (synthetic)",
    synthetic: true,
  },
  {
    id: "DR-000872", caseId: "EX-24088", timestamp: "2026-09-04T09:03:00.000Z",
    tariffVersion: "n/a", agentVersion: "not invoked", inputs: ["Corrected endorsement: NCSO DL 06/08/26"],
    sources: ["Pharmacy correction revision 2"], checks: [], recommendation: "NONE", decision: "ACCEPT",
    isOverride: false, overrideReason: "Human checked the corrected initials and date.",
    reason: "Human checked the corrected initials and date.", revision: 2, operator: "Demo operator", synthetic: true,
  },
]);
