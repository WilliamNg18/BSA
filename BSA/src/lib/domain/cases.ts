import type { EndorsementFacts, ExceptionCase } from "./types";
import { HILLCREST_PHARMACY } from "./reference";

// SYNTHETIC demonstration cases. No real prescriptions, patients, pharmacies or
// contractor codes. Patient labels are placeholders; endorsement text is invented.

const readNcso = (
  initialled: boolean,
  dated: boolean,
  quoted: string,
  note: string,
): EndorsementFacts => ({
  type: "NCSO",
  present: true,
  initialled,
  dated,
  quotedText: quoted,
  note,
});

export const CASES: ExceptionCase[] = [
  {
    id: "EX-24107",
    scenario: "A",
    title: "Valid and complete",
    purpose: "Complete readable endorsement: priced by NHSBSA's existing rules engine, no person involved.",
    pharmacy: HILLCREST_PHARMACY,
    routingReason: "Complete endorsement: existing rules engine pricing, no person involved",
    channel: "Paper FP10",
    receivedAt: "2026-09-04T08:12:00",
    minutesInQueue: 212,
    imageQuality: 0.91,
    imageStyle: "printed",
    patientLabel: "Patient A (synthetic)",
    extracted: {
      productText: "Sertraline 50mg tablets",
      productCode: "SYN-SERT50-28",
      productConfidence: 0.98,
      quantity: 28,
      quantityConfidence: 0.97,
      endorsementText: "NCSO JB 14/08/26",
      endorsementConfidence: 0.94,
      prescriber: "Dr S Patel (synthetic)",
      dispensingDate: "2026-08-14",
    },
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Sertraline 50mg tablets  28", confidence: 0.98 },
      { id: "endorsement", label: "Endorsement margin", x: 68, y: 34, w: 28, h: 9, text: "NCSO JB 14/08/26", confidence: 0.94 },
    ],
    claim: { productCode: "SYN-SERT50-28", quantity: 28, amountClaimed: 3.41, endorsementText: "NCSO JB 14/08/26", submittedVia: "FP34C batch" },
    readings: [
      readNcso(true, true, "NCSO JB 14/08/26", "NCSO claim, initials JB, date 14 August 2026."),
      readNcso(true, true, "NCSO JB 14/08/26", "Initialled and dated NCSO endorsement."),
      readNcso(true, true, "NCSO JB 14/08/26", "NCSO endorsement carrying initials and a date."),
    ],
    inCoverage: true,
    initialState: "cleared_by_rules",
  },
  {
    id: "EX-24112",
    scenario: "B",
    title: "Missing or insufficient information",
    purpose: "Show clearer communication and less evidence-gathering: the note is initialled but not dated, the agent finds the exact gap, cites the rule and drafts the fix.",
    pharmacy: HILLCREST_PHARMACY,
    routingReason: "Handwritten endorsement: NCSO claim requires operator check",
    channel: "Paper FP10",
    receivedAt: "2026-09-04T09:47:00",
    minutesInQueue: 117,
    imageQuality: 0.82,
    imageStyle: "handwritten",
    patientLabel: "Patient B (synthetic)",
    extracted: {
      productText: "Amlodipine 10mg tablets",
      productCode: "SYN-AMLO10-28",
      productConfidence: 0.96,
      quantity: 28,
      quantityConfidence: 0.95,
      endorsementText: "NCSO  RK",
      endorsementConfidence: 0.81,
      prescriber: "Dr L Okafor (synthetic)",
      dispensingDate: "2026-08-21",
    },
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Amlodipine 10mg tablets  28", confidence: 0.96 },
      { id: "endorsement", label: "Endorsement margin", x: 68, y: 34, w: 28, h: 9, text: "NCSO  RK", confidence: 0.81 },
    ],
    claim: { productCode: "SYN-AMLO10-28", quantity: 28, amountClaimed: 2.95, endorsementText: "NCSO", submittedVia: "EPS claim message" },
    readings: [
      readNcso(true, false, "NCSO  RK", "NCSO claim with initials RK; no date present in the margin."),
      readNcso(true, false, "NCSO  RK", "Initialled NCSO endorsement; nothing that reads as a date."),
      readNcso(true, false, "NCSO  RK", "NCSO, initials only. Undated."),
    ],
    inCoverage: true,
    initialState: "operator_review_required",
  },
  {
    id: "EX-24119",
    scenario: "C",
    title: "Evidence conflict",
    purpose: "Show orchestration and reconciliation: the form, the extracted field and the claim message do not agree on quantity. The agent surfaces the disagreement rather than choosing.",
    pharmacy: HILLCREST_PHARMACY,
    routingReason: "Claim message quantity differs from captured form",
    channel: "Paper FP10",
    receivedAt: "2026-09-04T10:05:00",
    minutesInQueue: 99,
    imageQuality: 0.88,
    imageStyle: "printed",
    patientLabel: "Patient C (synthetic)",
    extracted: {
      productText: "Metformin 500mg tablets",
      productCode: "SYN-METF500-56",
      productConfidence: 0.97,
      quantity: 56,
      quantityConfidence: 0.93,
      endorsementText: "NCSO AM 19/08/26",
      endorsementConfidence: 0.9,
      prescriber: "Dr H Brennan (synthetic)",
      dispensingDate: "2026-08-19",
    },
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Metformin 500mg tablets  56", confidence: 0.93 },
      { id: "endorsement", label: "Endorsement margin", x: 68, y: 34, w: 28, h: 9, text: "NCSO AM 19/08/26", confidence: 0.9 },
    ],
    claim: { productCode: "SYN-METF500-56", quantity: 84, amountClaimed: 3.9, endorsementText: "NCSO AM 19/08/26", submittedVia: "EPS claim message" },
    readings: [
      readNcso(true, true, "NCSO AM 19/08/26", "NCSO claim, initials AM, dated 19 August 2026."),
      readNcso(true, true, "NCSO AM 19/08/26", "Initialled and dated NCSO endorsement."),
      readNcso(true, true, "NCSO AM 19/08/26", "Complete NCSO endorsement."),
    ],
    inCoverage: true,
    initialState: "operator_review_required",
  },
  {
    id: "EX-24123",
    scenario: "D",
    title: "Deliberate failure and abstention",
    purpose: "Show production judgement: a poor handwritten scan, no reliable rule match and disagreeing readings. The agent does not guess; it abstains and the item follows today's process.",
    pharmacy: HILLCREST_PHARMACY,
    routingReason: "Handwritten form: low-confidence read of endorsement",
    channel: "Paper FP10",
    receivedAt: "2026-09-04T10:31:00",
    minutesInQueue: 73,
    imageQuality: 0.31,
    imageStyle: "handwritten_poor",
    patientLabel: "Patient D (synthetic)",
    extracted: {
      productText: "Co-cod?mol 30/5?0 t?bs",
      productCode: null,
      productConfidence: 0.42,
      quantity: null,
      quantityConfidence: 0.28,
      endorsementText: "N?S? ~~ 1?/0?",
      endorsementConfidence: 0.19,
      prescriber: "Illegible",
      dispensingDate: "2026-08-27",
    },
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Co-cod?mol 30/5?0 t?bs  1??", confidence: 0.42 },
      { id: "endorsement", label: "Endorsement margin", x: 68, y: 34, w: 28, h: 9, text: "N?S? ~~ 1?/0?", confidence: 0.19 },
    ],
    claim: { productCode: "SYN-COCOD-100", quantity: 100, amountClaimed: 3.86, endorsementText: "", submittedVia: "FP34C batch" },
    readings: [
      { type: "NCSO", present: true, initialled: null, dated: null, quotedText: "N?S?", note: "Possibly NCSO; initials and date cannot be read." },
      { type: "UNKNOWN", present: true, initialled: null, dated: null, quotedText: "~~", note: "Marks present in the margin but the endorsement type cannot be determined." },
      { type: "SP", present: true, initialled: false, dated: true, quotedText: "1?/0?", note: "Could be a specials endorsement with a partial date; low confidence." },
    ],
    inCoverage: false,
    initialState: "agent_abstained",
  },
  {
    id: "EX-24101",
    scenario: "E",
    title: "Cleared by rules (no model call)",
    purpose: "Show cost discipline: a straightforward item that deterministic pre-checks clear without invoking the agent at all.",
    pharmacy: HILLCREST_PHARMACY,
    routingReason: "Referred-back item resubmitted: re-check required",
    channel: "Electronic (EPS)",
    receivedAt: "2026-09-04T07:40:00",
    minutesInQueue: 244,
    imageQuality: 0.99,
    imageStyle: "printed",
    patientLabel: "Patient E (synthetic)",
    extracted: {
      productText: "Amoxicillin 500mg capsules",
      productCode: "SYN-AMOX500-21",
      productConfidence: 0.99,
      quantity: 21,
      quantityConfidence: 0.99,
      endorsementText: "",
      endorsementConfidence: 1,
      prescriber: "Dr M Reyes (synthetic)",
      dispensingDate: "2026-08-11",
    },
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Amoxicillin 500mg capsules  21", confidence: 0.99 },
    ],
    claim: { productCode: "SYN-AMOX500-21", quantity: 21, amountClaimed: 1.02, endorsementText: "", submittedVia: "EPS claim message" },
    readings: [],
    inCoverage: true,
    initialState: "cleared_by_rules",
  },
  {
    id: "EX-24088",
    scenario: "F",
    title: "Human decision recorded",
    purpose: "Show the end state: a case already decided by an operator, with its record available for reconstruction.",
    pharmacy: HILLCREST_PHARMACY,
    routingReason: "Handwritten endorsement: NCSO claim requires operator check",
    channel: "Paper FP10",
    receivedAt: "2026-09-03T14:20:00",
    minutesInQueue: 0,
    imageQuality: 0.86,
    imageStyle: "handwritten",
    patientLabel: "Patient F (synthetic)",
    extracted: {
      productText: "Sertraline 50mg tablets",
      productCode: "SYN-SERT50-28",
      productConfidence: 0.97,
      quantity: 28,
      quantityConfidence: 0.96,
      endorsementText: "NCSO  DL",
      endorsementConfidence: 0.84,
      prescriber: "Dr S Patel (synthetic)",
      dispensingDate: "2026-08-06",
    },
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Sertraline 50mg tablets  28", confidence: 0.97 },
      { id: "endorsement", label: "Endorsement margin", x: 68, y: 34, w: 28, h: 9, text: "NCSO  DL", confidence: 0.84 },
    ],
    claim: { productCode: "SYN-SERT50-28", quantity: 28, amountClaimed: 3.41, endorsementText: "NCSO", submittedVia: "EPS claim message" },
    readings: [
      readNcso(true, false, "NCSO  DL", "NCSO claim with initials DL; undated."),
      readNcso(true, false, "NCSO  DL", "Initialled, not dated."),
      readNcso(true, false, "NCSO  DL", "NCSO initials only."),
    ],
    inCoverage: true,
    initialState: "human_decision_recorded",
  },
];

const GENERIC_SUPPLY_CASE: ExceptionCase = {
  ...CASES[4],
  id: "SYN-FQ123-TYPE2",
  title: "Generic supply evidence required",
  purpose: "Retain the prescribed synthetic generic product through every submission channel and revision.",
  routingReason: "Generic manufacturer, pack size and form require evidence",
  extracted: { ...CASES[4].extracted, productCode: "SYN-AMOX500-GENERIC-21", productText: "Amoxicillin 500mg capsules (generic synthetic)" },
  claim: { ...CASES[4].claim, productCode: "SYN-AMOX500-GENERIC-21" },
  initialState: "operator_review_required",
};

export function caseById(id: string | undefined): ExceptionCase | null {
  if (!id) return null;
  if (id === GENERIC_SUPPLY_CASE.id) return GENERIC_SUPPLY_CASE;
  return CASES.find((c) => c.id === id) ?? null;
}

/** Additional synthetic queue rows so the queue reads like a working day. */
export const QUEUE_FILLER: {
  id: string;
  routingReason: string;
  state: ExceptionCase["initialState"];
  recommendation: string;
  minutesInQueue: number;
  pharmacy: string;
}[] = [
  { id: "EX-24104", routingReason: "Broken bulk endorsement: quantity check", state: "agent_review_complete", recommendation: "Sufficient", minutesInQueue: 231, pharmacy: HILLCREST_PHARMACY.name },
  { id: "EX-24109", routingReason: "Specials: invoice price not stated", state: "operator_review_required", recommendation: "Refer back", minutesInQueue: 160, pharmacy: HILLCREST_PHARMACY.name },
  { id: "EX-24115", routingReason: "Out-of-pocket expenses claim above threshold", state: "additional_evidence_required", recommendation: "Request information", minutesInQueue: 108, pharmacy: HILLCREST_PHARMACY.name },
  { id: "EX-24120", routingReason: "Handwritten form: low-confidence read", state: "agent_abstained", recommendation: "Abstained", minutesInQueue: 91, pharmacy: HILLCREST_PHARMACY.name },
  { id: "EX-24098", routingReason: "NCSO endorsement present: concession claim", state: "cleared_by_rules", recommendation: "Cleared by rules", minutesInQueue: 0, pharmacy: HILLCREST_PHARMACY.name },
  { id: "EX-24093", routingReason: "Handwritten endorsement: NCSO claim", state: "human_decision_recorded", recommendation: "Refer back (accepted)", minutesInQueue: 0, pharmacy: HILLCREST_PHARMACY.name },
];
