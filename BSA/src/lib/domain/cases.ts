import type { EndorsementFacts, ExceptionCase, ItemChannel } from "./types";
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

export const TWO_GATE_CASES: readonly ExceptionCase[] = [
  {
    ...GENERIC_SUPPLY_CASE, id: "SYN-FQ123-MISMATCH", title: "Complete format, wrong pack",
    purpose: "A plausible pack passes format checks but conflicts with the independently retained claim and product catalogue.",
    routingReason: "Pack and claimed amount require reconciliation; legacy outcome is uncertain",
    epsPrescription: {
      prescriber: { name: GENERIC_SUPPLY_CASE.extracted.prescriber, practice: "Hillcrest practice (synthetic)" },
      patientLabel: "Mismatch example (synthetic)", prescriptionDate: "2026-08-11", dispensingDate: "2026-08-11",
      items: [{ prescribedCode: "SYN-AMOX500-GENERIC-21", product: "Amoxicillin 500mg capsules (generic synthetic)",
        strength: "500mg", form: "capsules", quantity: 21, dose: "Synthetic instruction, not for clinical use",
        dispensedCode: "SYN-AMOX500-GENERIC-21", dispensedName: "Amoxicillin 500mg capsules (generic synthetic)" }],
      prescriberEndorsement: "", dispenserEndorsement: "", exemptionStatus: "not_recorded", claimMessageState: "submitted",
      supplyEvidence: { ruleId: "SYN-EPS-SUPPLY", brandManufacturer: "Demo manufacturer (synthetic)", packSize: 28, form: "capsules" },
    },
  },
  {
    ...CASES[0], id: "SYN-FQ123-READABLE", title: "Readable paper, matching declaration",
    purpose: "A known readable synthetic scan independently agrees with the pharmacy declaration and claim.",
    paperDeclaration: { typedProduct: "Sertraline 50mg tablets", quantity: 28, endorsementText: "NCSO JB 14/08/26",
      dispensingDate: "2026-08-14", declaredByPharmacy: true },
  },
];

const CURRENT_CASES: readonly ExceptionCase[] = [
  { ...CASES[0], channel: "Electronic (EPS)" },
  {
    ...GENERIC_SUPPLY_CASE, id: "EX-24112", scenario: "B", channel: "Paper FP10",
    title: "Paper endorsement: brand required",
    purpose: "Correctly dated paper endorsement lacks the brand for a generic with several suppliers.",
    routingReason: "Brand or manufacturer required for a generic with several suppliers",
    extracted: { ...GENERIC_SUPPLY_CASE.extracted, endorsementText: "NCSO RK 21/08/26", dispensingDate: "2026-08-21" },
    claim: { ...GENERIC_SUPPLY_CASE.claim, endorsementText: "NCSO RK 21/08/26", submittedVia: "FP34C batch" },
    paperDeclaration: { typedProduct: "SYN-AMOX500-GENERIC-21", quantity: 21, endorsementText: "NCSO RK 21/08/26",
      dispensingDate: "2026-08-21", declaredByPharmacy: true, brandManufacturer: "", packSize: 21, form: "capsules" },
    pharmacySupplyRecord: { productCode: "SYN-AMOX500-GENERIC-21", quantity: 21, endorsementText: "NCSO RK 21/08/26",
      prescriber: "Dr M Reyes (synthetic)", brandManufacturer: "Demo manufacturer (synthetic)", packSize: 21, form: "capsules" },
    readings: Array.from({ length: 3 }, () => readNcso(true, true, "NCSO RK 21/08/26", "Initialled and dated synthetic endorsement.")),
    regions: [
      { id: "item", label: "Prescribed item", x: 6, y: 34, w: 58, h: 9, text: "Amoxicillin 500mg capsules (generic synthetic) 21", confidence: 0.99 },
      { id: "endorsement", label: "Endorsement", x: 68, y: 34, w: 28, h: 9, text: "NCSO RK 21/08/26; brand not supplied", confidence: 0.99 },
    ],
  },
  {
    ...CASES[1], id: "SYN-FQ123-MISMATCH", scenario: "E", channel: "Electronic (EPS)",
    title: "Wrong strength selected",
    purpose: "Prescription and pharmacy records identify 10mg; the claim selects a known 5mg pack.",
    routingReason: "Explicit human audit or a proposed strength check",
    imageQuality: 1, imageStyle: "printed", regions: [], readings: [],
    extracted: { ...CASES[1].extracted, productText: "Amlodipine 10mg tablets", endorsementText: "", dispensingDate: "2026-08-21" },
    claim: { productCode: "SYN-AMLO10-28", quantity: 28, amountClaimed: 0.82, endorsementText: "", submittedVia: "EPS claim message" },
    epsPrescription: {
      prescriber: { name: "Dr L Okafor (synthetic)", practice: "Hillcrest Practice (synthetic)" }, patientLabel: "Strength example (synthetic)",
      prescriptionDate: "2026-08-21", dispensingDate: "2026-08-21",
      items: [{ prescribedCode: "SYN-AMLO10-28", product: "Amlodipine 10mg tablets", strength: "10mg", form: "tablets",
        quantity: 28, dose: "Synthetic placeholder, not clinical advice", dispensedCode: "SYN-AMLO5-28", dispensedName: "Amlodipine 5mg tablets" }],
      prescriberEndorsement: "", dispenserEndorsement: "", exemptionStatus: "exempt", claimMessageState: "submitted",
      supplyRecord: { productCode: "SYN-AMLO10-28", quantity: 28 },
    },
    initialState: "operator_review_required",
  },
  {
    ...CASES[3], extracted: { ...CASES[3].extracted, endorsementText: "N?S? ~~ 27/08/26" },
    regions: CASES[3].regions.map((region) => region.id === "endorsement" ? { ...region, text: "N?S? ~~ 27/08/26" } : region),
    pharmacySupplyRecord: { productCode: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26",
      prescriber: "Dr Example (synthetic demo declaration)" },
    paperDeclaration: { typedProduct: "SYN-COCOD-100", quantity: 100, endorsementText: "NCSO JB 27/08/26",
      dispensingDate: "2026-08-27", declaredByPharmacy: true },
  },
];

/** The only operational identities in the current four-case demonstration. */
export const PLAYABLE_CASE_IDS = Object.freeze(["EX-24107", "EX-24112", "SYN-FQ123-MISMATCH", "EX-24123"] as const);
export function isPlayableCase(id: string | null | undefined): boolean {
  return typeof id === "string" && PLAYABLE_CASE_IDS.some((candidate) => candidate === id);
}
export const PLAYABLE_CASE_CHANNELS: Readonly<Record<typeof PLAYABLE_CASE_IDS[number], ItemChannel>> = Object.freeze({
  "EX-24107": "eps", "EX-24112": "paper", "SYN-FQ123-MISMATCH": "eps", "EX-24123": "paper",
});
export function playableCaseChannel(id: string): ItemChannel | null {
  const known = PLAYABLE_CASE_IDS.find((candidate) => candidate === id);
  return known ? PLAYABLE_CASE_CHANNELS[known] : null;
}
export const BACKGROUND_CASES: readonly ExceptionCase[] = Object.freeze(CASES.filter((c) => c.scenario === "C" || c.scenario === "F"));

export function caseById(id: string | undefined): ExceptionCase | null {
  if (!id) return null;
  if (id === GENERIC_SUPPLY_CASE.id) return GENERIC_SUPPLY_CASE;
  return CURRENT_CASES.find((c) => c.id === id) ?? CASES.find((c) => c.id === id) ?? TWO_GATE_CASES.find((c) => c.id === id) ?? null;
}
export const PLAYABLE_CASES: readonly ExceptionCase[] = Object.freeze(PLAYABLE_CASE_IDS.map((id) => {
  const c = caseById(id);
  if (!c) throw new Error(`Missing playable synthetic case: ${id}`);
  return c;
}));

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
